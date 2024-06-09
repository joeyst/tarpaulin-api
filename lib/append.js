/*
Functions/function factories for 
using req attributes and appending. 
*/

const { hasSchemaRequiredAttributes, extractSchemaAttributes } = require('./schemaValidation')
const { replaceObjectIdWithString, convertUnderscoreIdToId } = require('./mongo')
const { map, mapValues, pick, some, unshift } = require('lodash')

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

function findAndAppendModelInfoByFilter(collectionName, filterOptions, getObj, setObj, keepAttrs=null, checkNull=true) {
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
    filterOptions = mapValues(filterOptions, req[getObj].get)
    if (filterOptions._id) { filterOptions._id = new ObjectId(filterOptions._id) }
    mongoResult = await getMongoCollection(collectionName).findOne(filterOptions)

    if (!mongoResult && checkNull) {
      res.status(400).send()
    } else if (!mongoResult && !checkNull) {
      next()
    }

    const cleanFlow = [
      result => keepAttrs ? pick(result, keepAttrs) : result,
      replaceObjectIdWithString, convertUnderscoreIdToId 
    ]
    req[setObj] = cleanFlow(mongoResult)
    next()
  }
}

function insertModelAndAppendId(collectionName, getObj) {
  return async (req, _, next) => {
    const result = await getMongoCollection(collectionName).insertOne(req[getObj]) 
    req.id = result.insertedId.toString()
    next()
  }
}

function sendStatusCodeWithAttribute(statusCode, getObj, getAttr=null) {
  return async (req, res) => {
    if (getAttr) {
      res.status(statusCode).send({ [getAttr]: req[getObj][getAttr] })
    } else {
      res.status(statusCode).send(req[getObj])
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
        req.user.role === role && !getObj,
        req.user.role === role && req[getObj][getAttr] === req.user.id
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
    }
    next()
  }
}

module.exports = {
  checkAndAppendSchemaAttributes,
  findAndAppendModelInfoByFilter,
  appendJwtLoginInfo,
  checkIsAuthenticated,
  insertModelAndAppendId,
  sendStatusCodeWithAttribute
}