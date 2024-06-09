/*
Functions/function factories for 
using req attributes and appending. 
*/

const { hasSchemaRequiredAttributes, extractSchemaAttributes } = require('./schemaValidation')
const { replaceObjectIdWithString, convertUnderscoreIdToId } = require('./mongo')
const { mapValues, pick, some, last, get } = require('lodash')

// Schema-related 
function checkAndAppendSchemaAttributes(getAttr, setAttr, schema, checkHasRequired=true, checkHasAny=true) {
  return async (req, res, next) => {
    if (checkHasRequired && !hasSchemaRequiredAttributes(req[getAttr], schema)) {
      res.status(400).send()
    }
    else if (checkHasAny && (!req[getAttr] || Object.keys(req[getAttr]).length === 0)) {
      res.status(400).send()
    }
    else {
      req[setAttr] = extractSchemaAttributes(req[getAttr], schema)
      next()
    }
  }
}

function findAndAppendModelInfoByFilter(collectionName, filterOptions, setAttr, keepAttrs=null, checkResultIsNull=true) {
  /*
  filterOptions | Object with DB doc keys and req[filterOptionValue] values. 
                  NOTE: filterOptionValue can be dot-separated nested attributes, e.g. params.id. 
  setAttr       | req[setAttr] = collection.findOne(options)
  keepAttrs     | From DB result. 

  Example: 
    If params are:
    const req = { login: { id: 123, ... } }
    const filterOptions = { "studentId": "login.id" }

    Then:
    req[setAttr] = await getMongoCollection(collectionName)
      .findOne({ studentId: req.login.id })

  Converts result's ObjectId _id to string. Renames _id to id. 
  */
  return async (req, _, next) => {
    filterOptions = mapValues(filterOptions, attr => get(req, attr))
    if (filterOptions._id) { filterOptions._id = new ObjectId(filterOptions._id) }
    let mongoResult = await getMongoCollection(collectionName).findOne(filterOptions)

    if (!mongoResult && checkResultIsNull) {
      res.status(400).send()
    } 
    else if (!mongoResult && !checkResultIsNull) {
      next()
    } 
    else {
      mongoResult = keepAttrs ? pick(result, keepAttrs) : result
      mongoResult = replaceObjectIdWithString(mongoResult)
      req[setAttr] = convertUnderscoreIdToId(mongoResult) 
      next()
    }
  }
}

function insertModelAndAppendId(collectionName, getFrom) {
  return async (req, _, next) => {
    const result = await getMongoCollection(collectionName).insertOne(get(req, getFrom)) 
    req.id = result.insertedId.toString()
    next()
  }
}

function updateModelsByFilter(collectionName, filterOptions, data) {
  return async (req, _, next) => {
    filterOptions = mapValues(filterOptions, value => get(req, value))
    if (filterOptions._id) { filterOptions._id = new ObjectId(filterOptions._id) }
    await getMongoCollection(collectionName).update(filterOptions, { $set: get(req, data) }) 
    next()
  }
}

function deleteModelsByFilter(collectionName, filterOptions) {
  return async (req, _, next) => {
    filterOptions = mapValues(filterOptions, value => get(req, value))
    if (filterOptions._id) { filterOptions._id = new ObjectId(filterOptions._id) }
    await getMongoCollection(collectionName).delete(filterOptions) 
    next()
  }
}

function sendStatusCodeWithAttribute(statusCode, getAttr=null, key=null) {
  return async (req, res) => {
    if (!getAttr) {
      res.status(statusCode).send()
    }
    else if (key) {
      res.status(statusCode).send({ [key]: get(req, getAttr, null) })
    } 
    else {
      res.status(statusCode).send(get(req, getAttr, null))
    }
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

// Mongo-related 
function isMeetsAuthenticationRequirement(req) {
  return (role, getObj=null, getAttr=null) => {
    return some([
        req.login.role === role && !getObj,
        req.login.role === role && req[getObj][getAttr] === req.login.id
    ])
  }
}

function checkIsAuthenticated(authorizationRequirements) {
  /* 
  Takes array of [role, getObj?, getAttr?]. 
  Sends error response if no conditions provide authorization. 
  */
  return async (req, res, next) => {
    const isMeetsAuthenticationRequirementCb = isMeetsAuthenticationRequirement(req)
    if (!(some(authorizationRequirements, requirements => isMeetsAuthenticationRequirementCb(...requirements)))) {
      res.status(403).send()
    } else {
      next()
    }
  }
}

function checkIsCondition(fn, attr, statusCode) {
  return async (req, res, next) => {
    if (!fn(get(req, attr))) {
      res.status(statusCode).send()
    } else {
      next()
    }
  }
}

module.exports = {
  checkAndAppendSchemaAttributes,
  findAndAppendModelInfoByFilter,
  appendJwtLoginInfo,
  checkIsAuthenticated,
  insertModelAndAppendId,
  updateModelsByFilter,
  deleteModelsByFilter,
  sendStatusCodeWithAttribute,
  checkIsCondition
}