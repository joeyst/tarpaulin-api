const { ObjectId } = require('mongodb')
const { getMongoCollection } = require('../lib/mongo')

const CourseSchema = {
  subject: { require: true },
  number: { require: true },
  title: { require: true },
  term: { require: true },
  instructorId: { require: true}
}

async function getCourseInfoById(id) {
  if (!ObjectId.isValid(id)) { return null }
  return await getMongoCollection('courses').findOne({ _id: new ObjectId(id) })
}

async function getCourseList(query, options, limit) {
  return await getMongoCollection('courses').find(query, options).limit(limit).toArray()
}

module.exports = {
  CourseSchema,
  getCourseInfoById,
  getCourseList
}