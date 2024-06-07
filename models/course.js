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

async function addCourse(courseObject): Promise<string> {
  return await getMongoCollection('courses')
    .insertOne(courseObject)
    .then(result => result.insertedId.toString())
}

async function partialUpdateCourse(id, courseObject) {
  return await getMongoCollection('courses')
    .updateOne({ _id: id}, { $set: courseObject }) 
}

module.exports = {
  CourseSchema,
  getCourseInfoById,
  getCourseList,
  addCourse, 
  partialUpdateCourse
}