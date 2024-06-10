
const { Router } = require('express')

const router = Router()

const { getUserInfoByEmail, isUserPasswordCorrect, UserSchema } = require('../models/user')
const { isUserAdmin } = require('../lib/jsonwebtoken')

const { checkIsAuthenticated, checkAndAppendSchemaAttributes } = require('../lib/append')

const UserLoginSchema = { 
  email: { required: true},
  password: { required: true }
}

router.get(
  '/:id',
  checkIsAuthenticated(['student', 'params', 'id'], ['instructor', 'params', 'id']),
  async (req, res) => {
    /*
    Fetches data about a specific User. 
    case User role:
      "student"    => list of courses student is enrolled in | Gets User courseIds attribute 
      "instructor" => list of courses instructor teaches     | Filters Courses by User instructorId 
    */
    if (req.user.role === "instructor") {
      const courseCollection = getMongoCollection("courses")
      res.status(200).send(await courseCollection.find({ instructorId: req.params.id })).map(course => course._id).toArray()
    } else {
      const userCollection = getMongoCollection("users")
      res.status(200).send((await userCollection.findOne({ _id: req.params.id })).courseIds)
    }
  }
)

router.post(
  '/login', 
  checkAndAppendSchemaAttributes('body', 'user', UserLoginSchema),
  checkUserPassword, 
  async (req, res) => {
    const userInfo = await getMongoCollection('users').findOne({ email })
    if (!(await isUserPasswordCorrect(password, userInfo._id.toString()))) {
      res.status(401).send()
    }
    /* Sends {token: ...}. */
    const { name, email, _id: id } = getUserInfoByEmail(req.user.email)
    res.status(200).send({ token: getJwtTokenFromUser({ name, email, id } )})
})

router.post('/', checkAndAppendSchemaAttributes('body', 'user', UserSchema), async (req, res) => {
  if (!["admin", "instructor", "user"].includes(req.user.role)) {
    res.status(400).send()
    return
  }
  else if (
    (role == "instructor" || role == "admin") &&
    req.login.role !== "admin"
   ) {
    res.status(403).send()
    return
  }
  const usersCollection = getMongoCollection('users')
  if (await usersCollection.findOne({ email: req.user.email })) {
    res.status(400).send()
  }
  const id = await usersCollection.insertOne(req.user)
  res.status(201).send({ id })
})

module.exports = router
