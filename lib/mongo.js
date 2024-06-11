const { MongoClient } = require('mongodb')

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDbName = process.env.MONGO_DB_NAME
const mongoAuthDbName = process.env.MONGO_AUTH_DB_NAME || mongoDbName

//const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoAuthDbName}`
const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDbName}?authSource=${mongoAuthDbName}`
console.log(`MONGO URL: ${mongoUrl}`)

let db = null
let _closeDbConnection = null
function connectToDb(callback) {
  console.log("CONNECT TO DB")
  console.log(`MONGO URL: ${mongoUrl}`)
  console.log(`MONGO DB NAME: ${mongoDbName}`)
  MongoClient.connect(mongoUrl, function (err, client) {
    if (err) {
      console.log("\n\n\nHIT ERROR.\n\n\nHIT ERROR.\n\n\nHIT ERROR.\n\n\nHIT ERROR.\n\n\n")
      console.error("Failed to connect to MongoDB:", err)
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

function replaceObjectIdWithString(object) {
  object._id = object._id.toString()
  return object 
}

function convertUnderscoreIdToId(object) {
  object.id = object._id
  delete object._id
  return object
}

module.exports = {
  connectToDb,
  getDbReference,
  closeDbConnection,
  getMongoCollection,
  getProjectionOptions,
  replaceObjectIdWithString, 
  convertUnderscoreIdToId
}
