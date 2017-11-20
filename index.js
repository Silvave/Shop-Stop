const config = require('./config/config')
const database = require('./config/database.config')
const express = require('express')
const port = 1337

let app = express()
let enviroment = process.env.NODE_ENV || 'development'

database(config[enviroment])
require('./config/express')(app, config[enviroment])
require('./config/routes')(app)
require('./config/passportt')()

app.listen(port)