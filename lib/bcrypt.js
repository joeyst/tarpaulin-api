
const { hashSync, compareSync } = require('bcrypt')

function getPasswordHashed(password) {
  return hashSync(password, 10)
}

function comparePassword(reqPassword, userPassword) {
  return compareSync(reqPassword, userPassword)
}

module.exports = {
  getPasswordHashed, 
  comparePassword 
}
