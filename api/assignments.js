

const { Router } = require('express')

const router = Router()

const { AssignmentSchema, SubmissionSchema } = require('../models/assignment')
const { checkAndAppendSchemaAttributes, findAndAppendModelInfoByFilter, findAndAppendModelsInfoByFilter, 
  checkIsAuthenticated, insertModelAndAppendId, sendStatusCodeWithAttribute, checkIsCondition, appendByFunction, updateModelsByFilter, deleteModelsByFilter } = require('../lib/append')

const resultsPerPage = 10

router.post(
  '/', 
  checkAndAppendSchemaAttributes('body', 'assignment', AssignmentSchema), 
  findAndAppendModelInfoByFilter('courses', { _id: 'body.courseId' }, 'course'),
  checkIsAuthenticated(['admin'], ['instructor', 'course', 'instructorId']),
  insertModelAndAppendId('assignments', 'assignment'),
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

router.delete(
  '/:id',
  findAndAppendModelInfoByFilter('assignments', { _id: 'params.id' }, 'assignment'),
  findAndAppendModelInfoByFilter('courses', { _id: 'assignment.courseId' }, 'course'),
  checkIsAuthenticated(['admin'], ['instructor', 'assignment', 'instructorId']),
  deleteModelsByFilter('assignments', { _id: 'params.id' }),
  deleteModelsByFilter('submissions', { assignmentId: 'params.id' }),
  sendStatusCodeWithAttribute(204)
)

router.get(
  '/:id/submissions', 
  checkIsCondition(page => !(typeof page === "string") || !isNan(parseInt(page)), 'query.page', 400),
  appendByFunction(page => resultsPerPage * ((parseInt(page) || 1) - 1), 'skipNumber', 'query.page'),
  appendByFunction(() => resultsPerPage, 'resultsPerPage'), 
  appendByFunction((assignmentId, studentId) => { assignmentId, studentId }, 'options', 'params.id', 'query.studentId'),
  appendByFunction(obj => omitBy(obj, isNull)),
  findAndAppendModelsInfoByFilter('submissions', 'options', 'submissions', skipAttr='skipNumber', limitAttr='resultsPerPage'),
  sendStatusCodeWithAttribute(200, 'submissions')
)

router.post(
  '/:id/submissions', 
  checkAndAppendSchemaAttributes('body', 'submission', SubmissionSchema),
  findAndAppendModelInfoByFilter('assignments', { _id: 'params.id' }, 'assignment'),
  // TODO: Remove log-in requirement from appendJwtLoginInfo. 
  checkIsAuthenticated('student'),
  findAndAppendModelInfoByFilter('users', { _id: 'login.id', courseIds: 'assignment.courseId' }, 'user'),
  insertModelAndAppendId('submissions', 'submission'),
  sendStatusCodeWithAttribute(201, 'id', 'id')
)

module.exports = router
