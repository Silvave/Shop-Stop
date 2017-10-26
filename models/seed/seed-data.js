const Category = require('../Category')
const Product = require('../Product')
const User = require('../User')

const encryption = require('../../utilities/encryption')

const INITIAL_ADMIN = {
  username: 'admin',
  firstName: 'Pesho',
  lastName: 'Petrov',
  salt: '',
  password: 'Admin123',
  age: 26,
  gender: 'Male',
  roles: ['Admin']
}

const DEMO_PRODUCTS = [
  {
    name: 'Dell XPS 13',
    description: 'The best laptop ever',
    price: 1700,
    creator: 'admin',
    category: 'Laptops',
    image: '\\content\\images\\seed-images\\dell_xps_13.jpg'
  },
  {
    name: 'HP Something',
    description: 'Well.. Yeah',
    price: 1200,
    creator: 'admin',
    category: 'Laptops',
    image: '\\content\\images\\seed-images\\hp_envy.jpg'
  }
]

const DEMO_CATEGORY = {
  name: 'Laptops',
  creator: 'admin'
}

module.exports.seedInitialData = async () => {
  await User.findOne({username: 'admin'}).then(async admin => {
    if (admin) {
      return
    }

    let salt = encryption.generateSalt()
    let hashedPassword = encryption.generateHashedPassword(salt, INITIAL_ADMIN.password)

    INITIAL_ADMIN.salt = salt
    INITIAL_ADMIN.password = hashedPassword

    await User.create(INITIAL_ADMIN)
  })

  await Category.findOne({name: DEMO_CATEGORY.name}).then(async category => {
    if(category) {
      return
    }

    let user = await User.findOne({username: DEMO_CATEGORY.creator}).then(user => {
      return user
    })

    DEMO_CATEGORY.creator = user._id
    
    await Category.create(DEMO_CATEGORY).then(async category => {
      user.createdCategories.push(category._id)
      await user.save()
    })
  })

  await Product.findOne().then(async product => {
    if (product) {
      return
    }

    for (let productData of DEMO_PRODUCTS) {
      let category = await Category.findOne({name: productData.category})
        .then(category => category)

      let user = await User.findOne({username: productData.creator})
      .then(user => user)

      productData.creator = user._id
      productData.category = category._id

      let createdProduct = await Product.create(productData)
        .then(product => product)

      category.products.push(createdProduct._id)

      user.createdProduct.push(createdProduct._id)

      await Promise.all([user.save(), category.save()]).then(([user, category]) => {
        console.log(`Updated user: ${user}\nUpdated category: ${category}`)
      })
    }
  })
}