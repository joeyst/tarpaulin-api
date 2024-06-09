/*
Functions/function factories for 
using req attributes and appending. 
*/

const { hasSchemaRequiredAttributes, extractSchemaAttributes } = require('./schemaValidation')
const { replaceObjectIdWithString, convertUnderscoreIdToId } = require('./mongo')

// Schema-related 
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

// JWT-related 
async function appendJwtLoginInfo(req, res, next) {
  const authHeader = req.get('Authorization')?.trim()
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  try {
    req.login = jwt.verify(token).sub
    const { role, courseIds } = await getUserInfoById(req.login.id)
    req.login.role = role 
    req.login.courseIds = courseIds 
    next()
  } catch (_) {
    res.status(401).send({ error: "Invalid JWT token."})
  }
}

module.exports = {
  checkAndAppendSchemaAttributes,
  findAndAppendModelInfoByFilter,
  appendJwtLoginInfo
}