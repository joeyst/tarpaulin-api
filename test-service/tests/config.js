const apiName = process.env.API_HOST
const apiPort = process.env.API_PORT

const baseUrl = `http://${apiName}:${apiPort}`

module.exports = {
  apiName, 
  apiPort,
  baseUrl
}