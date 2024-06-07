const { ObjectId } = require('mongodb')
const { getMongoCollection } = require('../lib/mongo')

const AssignmentSchema = {
  courseId: { require: true },
  title: { require: true },
  points: { require: true },
  due: { require: true }
}

async function getAssignmentInfoById(id) {
  if (!ObjectId.isValid(id)) { return null }
  return await getMongoCollection('assignments').findOne({ _id: new ObjectId(id) })
}

module.exports = {
  AssignmentSchema,
  getAssignmentInfoById
}