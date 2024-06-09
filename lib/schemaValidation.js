
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

function appendModelInfoByAttribute(collectionName, reqSrc, options, setAttr, projectionAttrs=null) {
  /*
  reqSrc: req[reqSrc] for target values. 
  getAttrArray: req[getAttrArray[0]][getAttrArray[1]]
  setAttr     : req[setAttr] = queryResult 

  reqSrcObject: req[reqSrc] 

  Converts ObjectId _id to string. Renames _id to id. 
  */
  return async (req, res, next) => {
    const src = req[reqSrc]
    const object = Object.keys(options).
    const result = getMongoCollection(collectionName)
      .find({ findAttr })
  }
}

function appendModelsInfoByAttribute(collectionName, getAttrArray, setAttr, projectionAttrs=null, skipAttrArray=null, limitAttr=null) {
  /*
  getAttrArray: req[getAttrArray[0]][getAttrArray[1]]
  setAttr     : req[setAttr] = queryResult 

  Converts ObjectId _id to string. Renames _id to id. 
  */
  return async (req, res, next) => {
    const result = getMongoCollection(collectionName)
  }
}

module.exports = {
  hasSchemaRequiredAttributes,
  extractSchemaAttributes,
  checkAndAppendSchemaAttributes
}