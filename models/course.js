const { ObjectId } = require('mongodb')
const { getMongoCollection } = require('../lib/mongo')

const CourseSchema = {
  subject: { required: true },
  number: { required: true },
  title: { required: true },
  term: { required: true },
  instructorId: { required: true}
}

async function getCourseInfoById(id) {
  if (!ObjectId.isValid(id)) { return null }
  return await getMongoCollection('courses').findOne({ _id: new ObjectId(id) })
}

async function getCourseList(query, options, limit) {
  return await getMongoCollection('courses').find(query, options).limit(limit).toArray()
}

async function addCourse(courseObject) {
  return await getMongoCollection('courses')
    .insertOne(courseObject)
    .then(result => result.insertedId.toString())
}

async function partialUpdateCourse(id, courseObject) {
  return await getMongoCollection('courses')
    .updateOne({ _id: id}, { $set: courseObject }) 
}

async function isCourseIdInUserCourseIds(courseId, userId) {
  const courseIds = await getMongoCollection('users').findOne({ _id: userId })
  return (courseIds || []).includes(courseId)
}

async function isCourseExists(courseId) {
  return !!(await getCourseInfoById(courseId))
}

module.exports = {
  CourseSchema,
  getCourseInfoById,
  getCourseList,
  addCourse, 
  partialUpdateCourse,
  isCourseIdInUserCourseIds, 
  isCourseExists 
}