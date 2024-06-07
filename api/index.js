const { Router } = require('express')
const { appendJwtLoginInfo } = require('../lib/jsonwebtoken')

const router = Router()

router.use(appendJwtLoginInfo)

router.use('/users', require('./users'))
router.use('/courses', require('./courses'))
router.use('/assignments', require('./assignments'))

module.exports = router
