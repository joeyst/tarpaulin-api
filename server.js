const express = require('express')
const rateLimiter = require('./lib/rateLimiter')
const morgan = require('morgan')
const { appendJwtLoginInfo } = require('./lib/append')

const api = require('./api')
const { connectToDb } = require('./lib/mongo')

const app = express()
const port = process.PORT || 8000

app.use(rateLimiter)
app.use(morgan('dev')) // Logging 
app.use(express.json()) // Parsing requests to JSON 
app.use(express.static('public')) // Serving files in public directory 

app.use('/', appendJwtLoginInfo)
app.use('/', api) // URLs
app.use('*', function (req, res, next) { // Catch all for missing pages 
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  })
})

app.use('*', (err, req, res, next) => { // Catch all for errors 
  console.error(err);
  res.status(500).send({
    err: "An error occurred. Try again later."
  });
});

connectToDb(function () { // Listening after connecting to DB 
  app.listen(port, function () {
    console.log("== Server is running on port", port)
  })
})
