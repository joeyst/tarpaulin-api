const { MongoClient } = require('mongodb')

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDbName = process.env.MONGO_DB_NAME
const mongoAuthDbName = process.env.MONGO_AUTH_DB_NAME || mongoDbName

const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoAuthDbName}`

let db = null
let _closeDbConnection = null
function connectToDb(callback) {
  MongoClient.connect(mongoUrl, function (err, client) {
    if (err) {
      throw err
    }
    db = client.db(mongoDbName)
    _closeDbConnection = function () {
      client.close()
    }
    callback()
  })
}

function getDbReference() {
  return db
}

function closeDbConnection(callback) {
  _closeDbConnection(callback)
}

function getMongoCollection(collectionName) {
  return getDbReference().collection(collectionName)
}

function getProjectionOptions(inclAttrs, schema) {
  return Object.keys(schema).map(inclAttrs.includes).map(Number)
}

module.exports = {
  connectToDb,
  getDbReference,
  closeDbConnection,
  getMongoCollection,
  getProjectionOptions
}
