
const { Router } = require('express')

const router = Router()

// TODO: Add /users/{id}, /users/login, /users 

router.get('/:id', (req, res, next) => {
  if () {
    const { id, role } = getUserInfoById(req.params.id)
    const courseCollection = getMongoCollection("courses")
    if (role === "instructor") {
      res.status(200).send(await courseCollection.find())
    } else if (role === "student") {
      res.status(200).send(await courseCollection.find())
    } else {
      res.status
    }
  }
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
