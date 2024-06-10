const { ObjectId } = require('mongodb')
const { getMongoCollection } = require('../lib/mongo')

const AssignmentSchema = {
  courseId: { required: true },
  title: { required: true },
  points: { required: true },
  due: { required: true }
}

async function getAssignmentInfoById(id) {
  if (!ObjectId.isValid(id)) { return null }
  return await getMongoCollection('assignments').findOne({ _id: new ObjectId(id) })
}

const SubmissionSchema = {
  assignmentId: { required: true },
  studentId: { required: true },
  timestamp: { required: true },
  grade: { required: true },
  file: { required: true }
}

module.exports = {
  AssignmentSchema,
  getAssignmentInfoById,
  SubmissionSchema
}