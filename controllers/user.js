const User = require('../models/User')
const encryption = require('../utilities/encryption')

module.exports.registerGet = (req, res) => {
  res.render('user/register')
}

module.exports.registerPost = (req, res) => {
  let user = req.body

  if (!user.password || user.password !== user.confirmedPassword) {
    if (!user.password)
      user.error = 'Please type a password'
    else
      user.error = 'Password do not match.'
    res.render('user/register', user)
    return
  }

  let salt = encryption.generateSalt()
  let hashedPassword = encryption.generateHashedPassword(salt, user.password)

  // It is good practice to create new obj with the properties you need
  // to pass the database and not to pass directly the one from the req.body
  let createUser = {
    username: user.username,
    password: hashedPassword,
    salt: salt,
    firstName: user.firstName,
    lastName: user.lastName,
    age: user.age,
    gender: user.gender
  }

  User.create(createUser)
    .then(createdUser => {
      req.logIn(createdUser, (error, user) => {
        if (error) {
          res.render('user/register', { error: 'Authentication not working!' })
          return
        }

        res.redirect('/')
      })
    })
    .catch(error => {
      // If User.create fails this method will be invoked.
    user.error = error
    res.render('user/register', user)
  })
}

module.exports.loginGet = (req, res) => {
  res.render('user/login')
}

module.exports.loginPost = (req, res) => {
  let userToLogin = req.body

  User.findOne({ username: userToLogin.username }).then(user => {
    if (!user || !user.authenticate(userToLogin.password)) {
      res.render('user/login', { error: 'Invalid credentials!' })
    } else {
      req.logIn(user, (error, user) => {
        if (error) {
          res.render('user/login', { error: 'Authentication not working!' })

          return
        }

        res.redirect('/')
      })
    }
  })
}

module.exports.logout = (req, res) => {
  req.logout()
  res.redirect('/')
}