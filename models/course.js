const { ObjectId } = require('mongodb')
const { getMongoCollection } = require('../lib/mongo')

const CourseSchema = {
  subject: { require: true },
  number: { require: true },
  title: { require: true },
  term: { require: true },
  instructorId: { require: true}
}

exports.CourseSchema = CourseSchema