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

const SubmissionSchema = {
  assignmentId: { require: true },
  studentId: { require: true },
  timestamp: { require: true },
  grade: { require: true }
  file: { require: true }
}

module.exports = {
  AssignmentSchema,
  getAssignmentInfoById,
  SubmissionSchema
}