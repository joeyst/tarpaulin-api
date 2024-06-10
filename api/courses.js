
const { Router } = require('express')

const router = Router()

const { getCourseList, CourseSchema } = require('../models/course')
const { getMongoCollection } = require('../lib/mongo')

const { json2csv } = require('json-2-csv')

const resultsPerPage = 10

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

router.get(
  '/:id/students', 
  findAndAppendModelInfoByFilter('courses', { _id: 'params.id' }, 'course'),
  checkIsAuthenticated(['admin'], ['instructor', 'course', 'instructorId']),
  findAndAppendModelsInfoByFilter('users', { courseIds: 'params.id' }, 'users', ['_id']),
  appendByFunction(obj => obj.id, 'users', 'users'),
  sendStatusCodeWithAttribute(200, 'users')
)

router.post(
  '/:id/students',
  findAndAppendModelInfoByFilter('courses', { _id: 'params.id' }, 'course'),
  checkIsAuthenticated(['admin'], ['instructor', 'course', 'instructorId']),
  async (req, _, next) => {
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
    next()
  },
  sendStatusCodeWithAttribute(200)
)

router.get(
  '/:id/roster',
  findAndAppendModelInfoByFilter('courses', { _id: 'params.id' }, 'course'),
  checkIsAuthenticated(['admin'], ['instructor', 'course', 'instructorId']),
  findAndAppendModelsInfoByFilter('users', { courseIds: 'params.id' }, 'users'),
  appendByFunction(user => [user.id, user.name, user.email], 'users', 'users'),
  async (req, res, next) => {
    res.set('Content-Type', 'text/csv')
    req.data = json2csv(req.users)
  },
  sendStatusCodeWithAttribute(200, 'data')
)

router.get(
  // TODO: Spec doesn't say requires authorization. It may be a good idea to have authorization here? 
  '/:id/assignments',
  findAndAppendModelsInfoByFilter('assignments', { courseId: 'params.id' }, 'assignments', ['_id']),
  setByFunction(assignment => assignment.id, 'assignments', 'assignments'),
  sendStatusCodeWithAttribute(200, 'assignments')
)

module.exports = router
