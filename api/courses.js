
const { Router } = require('express')

const router = Router()

const { getCourseInfoById, getCourseList } = require('../models/course')

// TODO: POST /courses, GET /courses/{id}, PATCH /courses/{id}, DELETE /courses/{id}, GET /courses/{id}/students, POST /courses/{id}/students, GET /courses/{id}/roster, GET /courses/{id}/assignments. 

const resultsPerPage = 10

router.get('/', async (req, res) => {
  /* page query parameter is 1-indexed, by OpenAPI specifications. */
  // TODO: Spec doesn't mention if invalid query. Should send error response? 
  const skipNumber = resultsPerPage * (parseInt(req.query.page) - 1) 
  delete req.query.page
  const courseList = await getCourseList(req.query, { skip: skipNumber }, resultsPerPage)
  res.status(200).send(courseList)
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
