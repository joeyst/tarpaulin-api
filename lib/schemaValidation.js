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

module.exports = {
  hasSchemaRequiredAttributes,
  extractSchemaAttributes
}