
const { ObjectId } = require('mongodb')
const { getMongoCollection } = require('../lib/mongo')
const { getPasswordHashed, comparePassword } = require('../lib/bcrypt')

const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: true },
  courseIds: { required: false }
}

async function getUserInfoById(id) {
  if (!ObjectId.isValid(id)) { return null }
  return await getMongoCollection('users').findOne({ _id: new ObjectId(id) })
}

async function getUserInfoByEmail(email) {
  return await getMongoCollection('users').findOne({ email })
}

async function addUser(userObject) {
  userObject.password = getPasswordHashed(userObject.password)
  return await getMongoCollection('users')
    .insertOne(userObject)
    .then(result => result.insertedId.toString())
}

async function isUserPasswordCorrect(password, id) {
  const { password: storedPassword } = await getUserInfoById(id)
  return comparePassword(password, storedPassword)
}

async function isUserExistsById(id) {
  return !!(await getUserInfoById(id))
}

module.exports = {
  UserSchema,
  getUserInfoById,
  getUserInfoByEmail,
  addUser,
  isUserPasswordCorrect,
  isUserExistsById
}
