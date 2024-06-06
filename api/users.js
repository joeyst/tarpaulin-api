
const { Router } = require('express')

const router = Router()

const { checkRequestIdMatchesTokenId, addUserInfoToRequest } = require('../lib/jsonwebtoken')
const { getUserInfoById, getUserInfoByEmail, isUserPasswordCorrect } = require('../models/user')

// TODO: Add /users/login, /users 

async function checkUserExists(req, res, next) {
  if (!!(await getUserInfoById(req.params.id))) {
    next()
  } else {
    res.status(404).send("User not found.")
  }
}

function checkLoginFieldsExist(req, res, next) {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).send()
  } 
  next()
}

function checkUserPassword(req, res, next) {
  if (!isUserPasswordCorrect(req.user.password, req.user.id)) {
    res.status(401).send()
  }
  next()
}

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

router.get('/:filename', (req, res, next) => {
  getImageDownloadStreamByFilename(req.params.filename)
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        next();
      } else {
        next(err);
      }
    })
    .pipe(res);
});

router.get('/thumbs/:filename', (req, res, next) => {
  getThumbnailDownloadStreamByFilename(req.params.filename)
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        next();
      } else {
        next(err);
      }
    })
    .pipe(res);
});

module.exports = router
