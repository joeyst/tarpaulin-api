
const { ObjectId } = require('mongodb')
const { getMongoCollection } = require('../lib/mongo')

const UserSchema = {
  name: { require: true },
  email: { required: true },
  password: { required: true },
  role: { required: true },
  courseIds: { required: false }
}

async function getUserInfoById(id) {
  // TODO: Add check for id = requested user ID. 
  if (!ObjectId.isValid(id)) { return null }
  return getMongoCollection('users').findOne({ _id: new ObjectId(id) })
}

async function addUser(userObject): string {
  // TODO: Check if userObject.id == decoded user ID. 
  // TODO: Salt userObject.password with bcrypt's hashSync (mutate userObject). 
  return getMongoCollection('users')
    .insertOne(userObject)
    .then(result => result.insertedId.toString()) // TODO: result.insertedId.toString()? 
}

exports.UserSchema = UserSchema
exports.getUserInfoById = getUserInfoById
exports.addUser = addUser
