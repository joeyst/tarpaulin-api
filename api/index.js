const { Router } = require('express')

const router = Router()

// TODO: router.use('/businesses', require('./businesses'))
// TODO: router.use('/photos', require('./photos'))
router.use('/users', require('./users'))

module.exports = router
