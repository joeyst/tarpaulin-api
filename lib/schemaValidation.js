
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

module.exports = {
  hasSchemaRequiredAttributes,
  extractSchemaAttributes,
  checkAndAppendSchemaAttributes
}