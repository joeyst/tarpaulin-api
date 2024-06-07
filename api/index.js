const { Router } = require('express')

const router = Router()

router.use()

router.use('/users', require('./users'))
router.use('/courses', require('./courses'))
router.use('/assignments', require('./assignments'))

module.exports = router
