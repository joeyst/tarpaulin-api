
const { baseUrl } = require('./config')

const axios = require('axios')
const { expect } = require('chai')

describe("GET /users/:id", () => {
  it('should get courses from student', async () => {
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

    const userId = "6668d10b2e2cd99aa78fbfa2"
    const config = {
      headers: {
        Authorization: `Bearer ${response.token}`
      }
    };

    try {
      const path = `${baseUrl}/users/${userId}`
      console.log(`PATH: ${path}`)
      const response = await axios.get(path, config)
      expect(response.status).to.equal(200)
      // expect(response.courseIds).to.equal(null)
    } catch (error) {
      throw new Error(`Login request failed: ${error.message}`)
    }
  })

  //it('should throw error if user with email already exists', async () => {
  //  const loginData = {
  //    email: 'email1',
  //    password: 'password3',
  //    name: 'name3',
  //    role: 'student'
  //  }
//
  //  try {
  //    await axios.post(`${baseUrl}/${ROUTE_PATH}`, loginData)
  //    throw new Error('Expected login request to fail')
  //  } catch (error) {
  //    expect(error.response.status).to.equal(400)
  //  }
  //})
//
  //it('should prevent unauthorized access', async () => {
  //  const loginData = {
  //    email: 'email4',
  //    password: 'password4',
  //    name: 'name4',
  //    role: 'instructor'
  //  }
//
  //  try {
  //    await axios.post(`${baseUrl}/${ROUTE_PATH}`, loginData)
  //    throw new Error('Expected login request to fail')
  //  } catch (error) {
  //    expect(error.response.status).to.equal(403)
  //  }
  //})
})
