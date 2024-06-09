

const { Router } = require('express')

const router = Router()

const { getCourseInfoById, isCourseIdInUserCourseIds } = require('../models/course')
const { getAssignmentInfoById, AssignmentSchema, SubmissionSchema } = require('../models/assignment')
const { isUserExistsById } = require('../models/user')
const { isUserAdmin, isUserInstructor, isUserStudent, isUserLoggedIn } = require('../lib/jsonwebtoken')
const { extractSchemaAttributes } = require('../lib/schemaValidation')
const { getMongoCollection } = require('../lib/mongo')

const { checkAndAppendSchemaAttributes, findAndAppendModelInfoByFilter, checkIsAuthenticated, insertModelAndAppendId, sendStatusCodeWithAttribute } = require('../lib/append')

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

router.post(
  '/', 
  checkAndAppendSchemaAttributes('body', 'assignment', AssignmentSchema), 
  findAndAppendModelInfoByFilter('courses', { _id: 'body.courseId' }, 'course'),
  checkIsAuthenticated(['admin'], ['instructor', 'course', 'instructorId']),
  insertModelAndAppendId('assignment', 'assignment'),
  sendStatusCodeWithAttribute(201, 'id', 'id')
)

router.get(
  '/:id', 
  findAndAppendModelInfoByFilter('assignments', { _id: 'params.id'}, 'assignment'),
  sendStatusCodeWithAttribute(200, 'assignment')
)

router.patch(
  '/:id', 
  findAndAppendModelInfoByFilter('assignments', { _id: 'params.id' }, 'assignment'),
  findAndAppendModelInfoByFilter('courses', { _id: 'assignment.courseId' }, 'course'),
  checkIsAuthenticated(['admin'], ['instructor', 'assignment', 'instructorId']),
  checkAndAppendSchemaAttributes('body', 'assignment', AssignmentSchema, checkHasRequired=false),
  updateModelsByFilter('assignments', { _id: 'params.id' }, 'assignment'),
  sendStatusCodeWithAttribute(200)
)

router.delete('/:id', checkAssignmentExists, checkUserIsAdminOrInstructorOfCourse, async (req, res) => {
  await getMongoCollection('assignments').delete({ _id: new ObjectId(req.params.id) })
  res.status(204).send()
})

router.get('/:id/submissions', checkAssignmentExists, checkUserIsAdminOrInstructorOfCourse, async (req, res) => {
  const assignmentId        = req.params.id
  var { studentId, page } = req.query

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
