
const { baseUrl } = require('./config')

const axios = require('axios')
const { expect } = require('chai')

describe('POST /users/login', () => {
  it('should log in with valid credentials', async () => {
    const loginData = {
      email: 'email5',
      password: 'password5'
    }

    try {
      const response = await axios.post(`${baseUrl}/users/login`, loginData)
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property('token')
    } catch (error) {
      throw new Error(`Login request failed: ${error.message}`)
    }
  })

  it('should return an error with invalid credentials', async () => {
    const loginData = {
      email: 'email5',
      password: 'password6'
    };

    try {
      await axios.post(`${baseUrl}/users/login`, loginData)
      throw new Error('Expected login request to fail')
    } catch (error) {
      expect(error.response.status).to.equal(401)
    }
  })

  it('should return an error with missing credentials', async () => {
    const loginData = {
      email: 'email1'
    };

    try {
      await axios.post(`${baseUrl}/users/login`, loginData)
      throw new Error('Expected login request to fail')
    } catch (error) {
      expect(error.response.status).to.equal(400)
    }
  })
})
