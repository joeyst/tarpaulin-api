
const { replaceObjectIdWithString, convertUnderscoreIdToId } = require('./mongo')

function hasSchemaRequiredAttributes(obj, schema) {
  return obj && Object.keys(schema).every(
    field => !schema[field].required || obj[field]
  )
}

function extractSchemaAttributes(obj, schema) {
  let validObj = {}
  Object.keys(schema).forEach((field) => {
    if (obj[field]) {
      validObj[field] = obj[field]
    }
  })
  return validObj
}

function checkAndAppendSchemaAttributes(getAttr, setAttr, schema) {
  return async (req, res, next) => {
    if (!hasSchemaRequiredAttributes(req[getAttr], schema)) {
      res.status(400).send()
    }
    req[setAttr] = extractSchemaAttributes(req[getAttr], schema)
    next()
  }
}

function findAndAppendModelInfoByFilter(collectionName, filterOptions, getObj, setObj, keepAttrs=null) {
  /*
  filterOptions | Object with DB doc keys and req[getObj].filterOptionValue values. 
  getObj        | collection.findOne({ someKeyAttr: req[getObj].someValueAttr, ... }) 
  setObj        | req[setObj] = collection.findOne(options)
  keepAttrs     | From DB result. 

  Example: 
    If params are:
    const req = { login: { id: 123, ... } }
    const getObj = "login" 
    const filterOptions = { "studentId": "id" }

    Then:
    req[setObj] = await getMongoCollection(collectionName)
      .findOne({ studentId: req.login.id })

  Converts result's ObjectId _id to string. Renames _id to id. 
  */
  return async (req, _, next) => {
    filterOptions = _.mapValues(filterOptions, req[getObj].get)
    if (filterOptions._id) { filterOptions._id = new ObjectId(filterOptions._id) }
    req[setObj] = await getMongoCollection(collectionName)
      .findOne(filterOptions)
      .then(result => keepAttrs ? _.pick(result, keepAttrs) : result)
      .then(replaceObjectIdWithString).then(convertUnderscoreIdToId)
    next()
  }
}

module.exports = {
  hasSchemaRequiredAttributes,
  extractSchemaAttributes,
  findAndAppendModelInfoByFilter
}