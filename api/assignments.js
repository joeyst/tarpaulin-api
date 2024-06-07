

const { Router } = require('express')

const router = Router()

const { getCourseInfoById, isCourseIdInUserCourseIds } = require('../models/course')
const { getAssignmentInfoById, AssignmentSchema, SubmissionSchema } = require('../models/assignment')
const { isUserExistsById } = require('../models/user')
const { isUserAdmin, isUserInstructor, isUserStudent, isUserLoggedIn, getJwtTokenDecoded } = require('../lib/jsonwebtoken')
const { hasRequiredSchemaAttributes, extractSchemaAttributes } = require('../lib/schemaValidation')
const { getMongoCollection } = require('../lib/mongo')

const { json2csv } = require('json-2-csv')

// TODO: GET /courses/{id}, PATCH /courses/{id}, DELETE /courses/{id}, GET /courses/{id}/students, POST /courses/{id}/students, GET /courses/{id}/roster, GET /courses/{id}/assignments. 

const resultsPerPage = 10

async function checkAssignmentExists(req, res, next) {
  if (!(await getAssignmentInfoById(req.params.id))) {
    res.status(404).send()
  }
  next()
}

async function checkUserIsAdminOrInstructorOfCourse(req, res, next) {
  const { courseId } = await getAssignmentInfoById(req.params.id)
  const courseInfo = await getCourseInfoById(courseId)
  if (!(
    await isUserAdmin(req.token) ||
    await isUserInstructor(req.token) === courseInfo.instructorId
  )) {
    res.status(403).send()
  }
  next()
}

async function appendAssignmentToBody(req, _, next) {
 req.assignment = extractSchemaAttributes(req.body, AssignmentSchema)
 next()
}

function replaceObjectIdWithString(object) {
  object._id = object._id.toString()
  return object 
}

function convertUnderscoreIdToId(object) {
  object.id = object._id
  delete object._id
  return object
}

router.post('/', async (req, res) => {
  if (!hasSchemaRequiredAttributes(req.body, AssignmentSchema)) {
    res.status(400).send()
  }

  courseInfo = await getCourseInfoById(req.body.courseId)

  if (!courseInfo) {
    res.status(400).send()
  }

  if (!(
    await isUserAdmin(req.token) || // TODO: Make (isUserInstructor(req.token) && userId === courseInfo.instructorId)
    await isUserInstructor(req.token) === courseInfo.instructorId
  )) {
    res.status(403).send()
  }

  const assignmentObject = extractSchemaAttributes(req.body)
  const id = await getMongoCollection('assignments')
    .insertOne(assignmentObject)
    .then(result => result.insertedId.toString())

  res.status(201).send({ id })
})

router.get('/:id', checkAssignmentExists, async (req, res) => {
  // TODO: Is this correct "summary data" (segun le specs). 
  const assignment = getAssignmentInfoById(req.params.id)
  res.status(200).send(assignment)
})

router.patch('/:id', checkAssignmentExists, appendAssignmentToBody, checkUserIsAdminOrInstructorOfCourse, async (req, res) => {
 if (!req.assignment || Object.keys(req.assignment).length === 0) {
    res.status(400).send()
  }

  await getMongoCollection('assignments').updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.course })
  res.status(200).send()
})

router.delete('/:id', checkAssignmentExists, checkUserIsAdminOrInstructorOfCourse, async (req, res) => {
  await getMongoCollection('assignments').delete({ _id: new ObjectId(req.params.id) })
  res.status(204).send()
})

router.get('/:id/submissions', checkAssignmentExists, checkUserIsAdminOrInstructorOfCourse, async (req, res) => {
  const assignmentId        = req.params.id
  var { studentId, page } = req.query.studentId 

  if (page !== null && isNan(parseInt(page))) {
    res.status(400).send() // TODO: Spec doesn't say to do res.status(400) here but it only really makes sense. 
  }

  page ||= 1
  const skipNumber = resultsPerPage * (parseInt(page) - 1) 

  const options = { assignmentId }
  if (
    studentId !== null && 
    (!ObjectId.isValid(studentId) || await isUserExistsById(studentId))
  ) {
    res.status(400).send() // TODO: Spec doesn't say to do res.status(400) here but it only really makes sense. 
  }

  if (studentId !== null) {
    options.studentId = studentId
  }

  const submissions = await getMongoCollection('submissions').find(options)
    .map(replaceObjectIdWithString).map(convertUnderscoreIdToId)
    .skip(skipNumber).limit(resultsPerPage).toArray()

  res.status(200).send(submissions)
})

router.post('/:id/submissions', checkAssignmentExists, async (req, res) => {
  if (!isUserLoggedIn(req.token) || !isUserStudent(req.token)) {
    res.status(403).send()
  }

  const { id: userId } = getDecodedJwtInfo(req.token)

  const assignmentId = req.params.id 
  const { courseId } = getAssignmentInfoById(assignmentId)

  if (!(await isCourseIdInUserCourseIds(courseId, userId))) {
    res.status(403).send()
  }

  const submission = extractSchemaAttributes(req.body, SubmissionSchema)

  const id = await getMongoCollection('submission').insertOne(submission)
  res.status(201).send({ id })
})

module.exports = router
