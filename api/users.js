
const { Router } = require('express')

const router = Router()

const { getUserInfoByEmail, isUserPasswordCorrect, UserSchema } = require('../models/user')
const { isUserAdmin } = require('../lib/jsonwebtoken')

const { checkIsAuthenticated } = require('../lib/append')

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
  const { name, email, password, role } = req.body
  // TODO: Add check for if email exists already. 
  if (role == "instructor" || role == "admin") {
    if (!isUserAdmin(req.token)) {
      res.status(403).send()
    }
    const id = await addUser({ name, email, password, role })
    res.status(201).send({ id })
  }
  // TODO: Add if role is "student". 
  // TODO: Add send status code 400(?) if role isn't "student", "instructor", or "admin"? Could be status code 403. 
})

module.exports = router
