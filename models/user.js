
const { ObjectId } = require('mongodb')
const { getMongoCollection } = require('../lib/mongo')

const UserSchema = {
  name: { require: true},
  email: { required: true },
  password: { required: true },
  role: { required: true}
}

async function getUserInfoById(id) {
  if (!ObjectId.isValid(id)) { return null }
  return getMongoCollection('users').findOne({ _id: new ObjectId(id) })
}

async function addUser(userObject): string {
  return getMongoCollection('users')
    .insertOne(userObject)
    .then(result => result.insertedId) // TODO: result.insertedId.toString()? 
}

exports.UserSchema = UserSchema
exports.getUserInfoById = getUserInfoById
exports.addUser = addUser
