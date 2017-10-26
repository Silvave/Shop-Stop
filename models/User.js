const PROPERTY_REQUIRED = '{0} is required'

const mongoose = require('mongoose')

const encryption = require('../utilities/encryption')

let userSchema = mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.String,
    required: PROPERTY_REQUIRED.replace('{0}', 'Username'),
    unique: true
  },
  password: {
    type: mongoose.Schema.Types.String,
    required: PROPERTY_REQUIRED.replace('{0}', 'Password')
  },
  salt: {
    type: mongoose.Schema.Types.String,
    required: true
  },
  firstName: {
    type: mongoose.Schema.Types.String,
    required: PROPERTY_REQUIRED.replace('{0}', 'First name')
  },
  lastName: {
    type: mongoose.Schema.Types.String,
    required: PROPERTY_REQUIRED.replace('{0}', 'Last name')
  },
  age: {
    type: mongoose.Schema.Types.Number,
    min: [0, 'Age must be between 0 and 120'],
    max: [120, 'Age must be between 0 and 120']
  },
  gender: {
    type: mongoose.Schema.Types.String,
    enum: {
      values: ['Male', 'Female'],
      message: 'Gender should be either "Male" or "Female".'
    }
  },
  roles: [{ type: mongoose.Schema.Types.String }],
  boughtProduct: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdProduct: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
})

userSchema.method({
  authenticate: function (password) {
    let hashedPassword = encryption.generateHashedPassword(this.salt, password)

    return hashedPassword === this.password
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User