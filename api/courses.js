
const { Router } = require('express')

const router = Router()

const { getCourseInfoById, getCourseList, addCourse, CourseSchema } = require('../models/course')
const { isUserAdmin, isUserInstructor, isUserStudent, isUserLoggedIn } = require('../lib/jsonwebtoken')
const { hasRequiredSchemaAttributes, extractSchemaAttributes } = require('../lib/schemaValidation')
const { getMongoCollection } = require('../lib/mongo')

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

router.post('/', checkUserIsAdmin, checkRequestBodyAgainstCourseSchema, appendCourseToBody, async(req, res) => {
  const id = await addCourse(req.course)
  res.status(201).send({ id })
})

router.get('/:id', checkCourseExists, async (req, res) => {
  res.status(200).send(getCourseInfoById(req.params.id))
})

router.patch('/:id', checkCourseExists, appendCourseToBody, async (req, res) => {
  if (!req.course || Object.keys(req.course).length === 0) {
    res.status(400).send()
  }

  const courseInfo = await getCourseInfoById(id)
  if (!(
    await isUserAdmin(req.token) ||
    await isUserInstructor(req.token) === courseInfo.instructorId
  )) {
    res.status(403).send()
  }

  await partialUpdateCourse(id, req.course)
  res.status(200).send()
})

router.delete('/:id', checkCourseExists, checkUserIsAdmin, async (req, res) => {
  res.status(204).send()
})

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

router.get('/:id', addUserInfoToRequest, checkRequestIdMatchesTokenId, checkUserExists, async (req, res) => {
  /*
  Fetches data about a specific User. 
  case User role:
    "student"    => list of courses student is enrolled in | Gets User courseIds attribute 
    "instructor" => list of courses instructor teaches     | Filters Courses by User instructorId 
  */
  if (req.user.role === "instructor") {
    const courseCollection = getMongoCollection("courses")
    res.status(200).send(await courseCollection.find({instructorId: "instructor"}))
  } else {
    const userCollection = getMongoCollection("users")
    res.status(200).send(await userCollection.find({_id: req.user.id}).then(user => user.courseIds))
  }
})

router.post('/login', checkLoginFieldsExist, checkUserPassword, async (req, res) => {
  // TODO: Add check that User with email exists with 401 status response.
  /* Sends {token: ...}. */
  const { name, email, _id: id } = getUserInfoByEmail(req.user.email)
  res.status(200).send({token: getJwtTokenFromUser({ name, email, id })})
})

router.post('/', checkUserCreateFieldsExist, async (req, res) => {
  const { name, email, password, role } = req.body
  // TODO: Add check for if email exists already. 
  if ((role == "instructor") || (role == "admin")) {
    const loggedInUserInfo = getJwtTokenDecoded(req.token)
    if (!loggedInUserInfo) {
      res.status(403).send()
    }
    const { loggedInUserRole } = await getUserInfoByEmail(loggedInUserInfo.email)
    if (loggedInUserRole !== "admin") {
      res.status(403).send()
    }
    const id = await addUser({ name, email, password, role })
    res.status(201).send({ id })
  }
})

module.exports = router
