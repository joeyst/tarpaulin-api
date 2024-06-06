const jwt = require('jsonwebtoken')

// TODO: Add APP_SECRET_KEY to all Docker compose services using APP_SECRET_KEY. 
const secret_key = process.env.APP_SECRET_KEY

function getJwtTokenFromUser(userObject) {
  const { _id: id, name, email } = userObject 
  return jwt.sign({id, name, email}, secret_key)
}

function getJwtTokenDecoded(jwtToken) {
  try {
    return jwt.verify(jwtToken, secret_key).sub
  }
  catch (err) {
    return null
  }
}

async function addUserInfoToRequest(req, _, next) {
  req.user = getJwtTokenDecoded(req.token)
  next()
}

async function checkRequestIdMatchesTokenId(req, res, next) {
  if (req.user.id !== req.params.id) {
    res.status(403).send()
  } else {
    next()
  }
}

module.exports = {
  getJwtTokenFromUser,
  getJwtTokenDecoded,
  checkRequestIdMatchesTokenId,
  addUserInfoToRequest
}