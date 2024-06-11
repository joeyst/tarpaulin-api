const { rateLimit } = require('express-rate-limit')

const windowMs = 60000
const limit    = 50000

const limiter = rateLimit({ windowMs, limit })

module.exports = limiter