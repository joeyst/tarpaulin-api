/*
 * Module for working with a MongoDB connection.
 */

const { MongoClient, ObjectId } = require('mongodb')

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDbName = process.env.MONGO_DB_NAME
const mongoAuthDbName = process.env.MONGO_AUTH_DB_NAME || mongoDbName

// const mongoHost
// const mongoPort


const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoAuthDbName}`
//const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDbName}?authSource=${mongoAuthDbName}`

let db = null
let _closeDbConnection = null
exports.connectToDb = function (callback) {
  console.log("CONNECTED TO DB.")
  console.log(`Mongo URL: ${mongoUrl}`)
  console.log(JSON.stringify({ mongoHost, mongoPort, mongoUser, mongoPassword, mongoDbName, mongoAuthDbName }))
  MongoClient.connect(mongoUrl, async function (err, client) {
    console.log("CONNECTED TO DB. (2)")
    if (err) {
      throw err
    }
    console.log("CONNECTED TO DB. (3)")
    db = client.db(mongoDbName)
    console.log(mongoUrl)
    _closeDbConnection = function () {
      client.close()
    }
    callback()
  })
}

exports.getDbReference = function () {
  return db
}

exports.closeDbConnection = function (callback) {
  _closeDbConnection(callback)
}

exports.getMongoCollection = function (collectionName) {
  return db.collection(collectionName)
}

async function updateImageAttributeById(id, key, value) {
  const db = exports.getDbReference()

  // Admittedly I took/adapted some code from online here for 
  // debugging purposes, will remove in next commit though! 
  db.collection('images.files').find({}).toArray((err, documents) => {
    if (err) {
      console.error('Error retrieving documents:', err);
      return;
    }

    console.log('All documents in the collection:');
    documents.forEach((document) => {
      console.log(document);
    });
  });

  const fromImageAttributeById = await (db.collection('images.files')
    .findOneAndUpdate({ "_id": new ObjectId(id) }, 
    { $set: { [key]: value } }))
  console.log(`fromImageAttributeById: ${JSON.stringify(fromImageAttributeById)}`)
}

exports.updateImageAttributeById = updateImageAttributeById 