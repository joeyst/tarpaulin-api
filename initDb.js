/*
 * This file contains a simple script to populate the database with initial
 * data from the files in the data/ directory.  The following environment
 * variables must be set to run this script:
 *
 *   MONGO_DB_NAME - The name of the database into which to insert data.
 *   MONGO_USER - The user to use to connect to the MongoDB server.
 *   MONGO_PASSWORD - The password for the specified user.
 *   MONGO_AUTH_DB_NAME - The database where the credentials are stored for
 *     the specified user.
 *
 * In addition, you may set the following environment variables to create a
 * new user with permissions on the database specified in MONGO_DB_NAME:
 *
 *   MONGO_CREATE_USER - The name of the user to create.
 *   MONGO_CREATE_PASSWORD - The password for the user.
 */

const { connectToDb, getDbReference, closeDbConnection } = require('./lib/mongo')

const usersData = require('./data/users.json')

const mongoCreateUser = process.env.MONGO_CREATE_USER
const mongoCreatePassword = process.env.MONGO_CREATE_PASSWORD

connectToDb(async function () {
  /*
   * Insert initial business data into the database
   */
  const usersToInsert = usersData.map(function (user) {
    return extractValidFields(user, UserSchema)
  })
  const db = getDbReference()
  const collection = db.collection('users')
  const result = await collection.insertMany(usersToInsert)
  const ids = result.insertedIds

  // const ids = await bulkInsertNewBusinesses(businessData)
  console.log("== Inserted businesses with IDs:", ids)

  /*
   * Create a new, lower-privileged database user if the correct environment
   * variables were specified.
   */
  console.log(`MONGOCREATEUSER: ${mongoCreateUser}`)
  console.log(`MONGOCREATEPWD: ${mongoCreatePassword}`)

  if (mongoCreateUser && mongoCreatePassword) {
    const db = getDbReference()
    const result = await db.createUser({
      user: "businesses",
      pwd: "hunter2",
      roles: [{ role: "readWrite", db: "businesses" }]
    })
    // const result = await db.addUser(mongoCreateUser, mongoCreatePassword, 
    //   { roles: [{ role: "readWrite", db: "businesses" }]})
    console.log("== New user created:", result)
  }

  closeDbConnection(function () {
    console.log("== DB connection closed")
  })
})
