
const { baseUrl } = require('./config')

const axios = require('axios')
const { expect } = require('chai')

describe('POST /users', () => {
  it('should create new user', async () => {
    const loginData = {
      email: 'email3',
      password: 'password3',
      name: 'name3',
      role: 'student'
    }

    try {
      const response = await axios.post(`${baseUrl}/users`, loginData)
      expect(response.status).to.equal(201)
    } catch (error) {
      throw new Error(`Login request failed: ${error.message}`)
    }
  })

  it('should throw error if user with email already exists', async () => {
    const loginData = {
      email: 'email1',
      password: 'password3',
      name: 'name3',
      role: 'student'
    }

    try {
      await axios.post(`${baseUrl}/users`, loginData)
      throw new Error('Expected login request to fail')
    } catch (error) {
      expect(error.response.status).to.equal(400)
    }
  })

  it('should prevent unauthorized access', async () => {
    const loginData = {
      email: 'email4',
      password: 'password4',
      name: 'name4',
      role: 'instructor'
    }

    try {
      await axios.post(`${baseUrl}/users`, loginData)
      throw new Error('Expected login request to fail')
    } catch (error) {
      expect(error.response.status).to.equal(403)
    }
  })
})
