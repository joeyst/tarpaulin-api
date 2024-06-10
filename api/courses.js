
const { Router } = require('express')

const router = Router()

const { getCourseInfoById, getCourseList, addCourse, CourseSchema } = require('../models/course')
const { isUserAdmin, isUserInstructor } = require('../lib/jsonwebtoken')
const { hasRequiredSchemaAttributes, extractSchemaAttributes } = require('../lib/schemaValidation')
const { getMongoCollection } = require('../lib/mongo')

const { json2csv } = require('json-2-csv')

// TODO: GET /courses/{id}, PATCH /courses/{id}, DELETE /courses/{id}, GET /courses/{id}/students, POST /courses/{id}/students, GET /courses/{id}/roster, GET /courses/{id}/assignments. 

const resultsPerPage = 10

async function checkCourseExists(req, res, next) {
  if (!(await getCourseInfoById(req.params.id))) {
    res.status(404).send()
  }
  next()
}

async function checkUserIsAdmin(req, res, next) {
  // TODO: Replace req.token with authorization header? 
  if (!(await isUserAdmin(req.token))) {
    res.status(403).send()
  }
  next()
}

async function checkRequestBodyAgainstCourseSchema(req, res, next) {
  if (!hasRequiredSchemaAttributes(req.body, CourseSchema)) {
    res.status(400).send()
  }
  next()
}

async function appendCourseToBody(req, _, next) {
  req.course = extractSchemaAttributes(req.body, CourseSchema)
  next()
}

router.get('/', async (req, res) => {
  /* page query parameter is 1-indexed, by OpenAPI specifications. */
  // TODO: Spec doesn't mention if invalid query. Should send error response? 
  const skipNumber = resultsPerPage * (parseInt(req.query.page) - 1) 
  delete req.query.page
  const courseList = await getCourseList(req.query, { skip: skipNumber }, resultsPerPage)
  res.status(200).send(courseList)
})

router.post(
  '/', 
  checkIsAuthenticated(['admin']),
  checkAndAppendSchemaAttributes('body', 'course', CourseSchema), 
  insertModelAndAppendId('courses', 'course'),
  sendStatusCodeWithAttribute(201, 'id', 'id')
)

router.get(
  '/:id',
  findAndAppendModelInfoByFilter('courses', { _id: 'params.id' }, 'course'),
  sendStatusCodeWithAttribute(200, 'course')
)

router.patch(
  '/:id',
  findAndAppendModelInfoByFilter('courses', { _id: 'params.id' }, 'course'),
  checkIsAuthenticated(['admin'], ['instructor', 'course', 'instructorId']),
  checkAndAppendSchemaAttributes('body', 'course', CourseSchema, checkHasRequired=false),
  updateModelsByFilter('courses', { _id: 'params.id' }, 'course'),
  sendStatusCodeWithAttribute(200)
)

router.delete(
  '/:id',
  findAndAppendModelInfoByFilter('courses', { _id: 'params.id' }, 'course'),
  checkIsAuthenticated(['admin']),
  deleteModelsByFilter('courses', { _id: 'params.id' }), // TODO: Does store instructorId etc. as a string? Gets as string. 
  findAndAppendModelsInfoByFilter('assignments', { courseId: 'params.id' }, 'assignments', ['_id']),
  deleteModelsByFilter('assignments', { courseId: 'params.id' }),
  deleteModelsByFilter('submissions' { assignmentId: 'assignmentIds' }),
  async (req, _, next) => {
    await getMongoCollection('users')
      .updateMany({}, { $pull: { courseIds: req.params.id } })
    next()
  },
  sendStatusCodeWithAttribute(204)
)

router.get('/:id/students', checkCourseExists, async (req, res) => {
  const courseInfo = await getCourseInfoById(req.params.id)
  if (!(
    await isUserAdmin(req.token) ||
    await isUserInstructor(req.token) === courseInfo.instructorId
  )) {
    res.status(403).send()
  }

  const studentIds = await getMongoCollection('users')
    .find({ courseIds: req.params.id }, { name: 0, email: 0, password: 0, role: 0, courseIds: 0 }).toArray()
    .then(results => results.map(result => result._id))

  res.status(200).send(studentIds)
})

router.post('/:id/students', checkCourseExists, async (req, res) => {
  /*
  req.body => { add, remove } 
  */ 
  const courseInfo = await getCourseInfoById(req.params.id)
  if (!(
    await isUserAdmin(req.token) ||
    await isUserInstructor(req.token) === courseInfo.instructorId
  )) {
    res.status(403).send()
  }

  // TODO: Add check for add and remove not being null and not being list. Status code 400? 

  let { add, remove } = req.body 

  const userCollection = getMongoCollection('users')

  // TODO: Which order do we add and remove in? Should we handle if userId is in both add and remove? 
  userCollection.updateMany(
    { _id: { $in: add || [] }},
    { $addToSet: { courseIds: req.params.id } }
  )

  userCollection.updateMany(
    { _id: { $in: remove || [] }},
    { $pull: { courseIds: req.params.id } }
  )

  res.status(200).send()
})

function replaceObjectIdWithString(object) {
  object._id = object._id.toString()
  return object 
}

function convertUnderscoreIdToId(object) {
  object.id = object._id
  delete object._id
  return object
}

router.get('/courses/:id/roster', checkCourseExists, async (req, res) => {
  const courseInfo = await getCourseInfoById(req.params.id)
  if (!(
    await isUserAdmin(req.token) ||
    await isUserInstructor(req.token) === courseInfo.instructorId
  )) {
    res.status(403).send()
  }

  const students = await getMongoCollection('users')
    .find({ courseIds: req.params.id }, { password: 0, role: 0, courseIds: 0 }).toArray()
    .map(replaceObjectIdWithString).map(convertUnderscoreIdToId)
    .map(result => [result.id, result.name, result.email]).toArray()

  res.set('Content-Type', 'text/csv')
  res.status(200).send(json2csv(students))
})

router.get('/courses/:id/assignments', checkCourseExists, async (req, res) => {
  // TODO: Spec doesn't say requires authorization. It may be a good idea to have authorization here? 
  await getMongoCollection('assignments')
    .find({ courseId: req.params.id }, { courseId: 0, title: 0, points: 0, due: 0 })
    .map(result => result._id).toArray()
})

module.exports = router
