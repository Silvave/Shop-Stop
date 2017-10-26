const Product = require('../models/Product')
const Category = require('../models/Category')
const User = require('../models/User')
const fs = require('fs')


module.exports.addGet = (req, res) => {
    Category.find().then((categories) => {
      res.render('product/add', { categories })
    })
}

module.exports.addPost = (req, res) => {
  let productObj = req.body
  productObj.image = '\\' + req.file.path
  productObj.creator = req.user._id

  Product.create(productObj).then((product) => {
    Category.findById(product.category).then((category) => {
      category.products.push(product._id)
      category.save()
    })

    req.user.createdProduct.push(product._id)
    req.user.save()

    res.redirect('/')
  })
}

module.exports.editGet = (req, res) => {
  let productId = req.params.id

  Product.findById(productId).then((product) => {
    if (!product) {
      res.sendStatus(404)
      return
    }

    if (!product.creator.equals(req.user._id) &&
        !req.user.roles.includes('Admin')) {
      res.redirect(`/?error=${encodeURIComponent('You are not authorized to edit this product!')}`)
      return
    }

    if (product.buyer) {
      res.redirect(`/?error=${encodeURIComponent('Product has been already bought!')}`)
      return
    }

    Category.find().then((categories) => {
      res.render('product/edit', { product, categories })
    })
  })
}

module.exports.editPost = (req, res) => {
  let productId = req.params.id
  let editedProduct = req.body

  Product.findById(productId).then((product) => {
    if (!product) {
      res.redirect(`/?error=${encodeURIComponent('error=Product was not found!')}`)
      return
    }

    if (!product.creator.equals(req.user._id) &&
      !req.user.roles.includes('Admin')) {
      res.redirect(`/?error=${encodeURIComponent('You are not authorized to edit this product!')}`)
      return
    }

    if (product.buyer) {
      res.redirect(`/?error=${encodeURIComponent('Product has been already bought!')}`)
      return
    }

    product.name = editedProduct.name
    product.description = editedProduct.description
    product.price = editedProduct.price

    if (req.file) {
      fs.unlink(`.${product.image}`, (err) => {
        if (err) {
          console.log(err)
          return
        }
        console.log('File deleted successfully!')
      })

      product.image = '\\' + req.file.path
    }

    // First we check if the category is changed
    if (product.category.toString() !== editedProduct.category.toString()) {
      let getCurrentCategory = Category.findById(product.category)
      let getNewCategory = Category.findById(editedProduct.category)

      Promise.all([getCurrentCategory, getNewCategory])
        .then(([ currentCategory, newCategory ]) => {
          let index = currentCategory.products.indexOf(product._id)

          if (index >= 0) {
            // Remove product specified from current category's list of products
            currentCategory.products.splice(index, 1)
          }
          currentCategory.save()

          newCategory.products.push(product._id)
          newCategory.save()

          product.category = editedProduct.category

          product.save().then(() => {
            res.redirect(
              `/?success=${encodeURIComponent('Product was edited successfully!')}`
            )
          })
      })
    } else {
      product.save().then(() => {
        res.redirect(
          `/?success=${encodeURIComponent('Product was edited successfully!')}`
        )
      })
    }
  })
}

module.exports.deleteGet = (req, res) => {
  let productId = req.params.id

  Product.findById(productId).then((product) => {
    if (!product) {
      res.sendStatus(404)
      return
    }

    if (product.buyer) {
      res.redirect(`/?error=${encodeURIComponent('Product has been already bought!')}`)
    }

    if (product.creator.equals(req.user._id) ||
        req.user.roles.includes('Admin')) {
      res.render('product/delete', {product})
    } else {
      res.redirect(`/?error=${encodeURIComponent('You are not authorized to delete this product!')}`)
    }
  })
}

module.exports.deletePost = (req, res) => {
  let productId = req.params.id

  if (!productId) {
    return
  }

  Product.findById(productId).then((product) => {
    if (!product) {
      return
    }

    if (product.buyer) {
      res.redirect(`/?error=${encodeURIComponent('Product has been already bought!')}`)
      return
    }

    if (!product.creator.equals(req.user._id) &&
        !req.user.roles.includes('Admin')) {
      res.redirect(`/?error=${encodeURIComponent('You are not authorized to delete this product!')}`)
      return
    }

    let delProdFromProdTable = product.remove()

    let delProdFromUserCreatedArr =
      User.findById(product.creator).then(user => {
        let productIdx = user.createdProduct.indexOf(product._id)

        if (productIdx >= 0) {
          user.createdProduct.splice(productIdx, 1)
        }

        return user.save()
      })

    let delProdImageFile = new Promise((resolve, reject) => {
      fs.unlink(`.${product.image}`, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve('File deleted successfully!')
      })
    })


    let delProdFromCategory =
      Category.findById(product.category).then((category) => {
        let index = category.products.indexOf(product._id)

        if (index >= 0) {
          category.products.splice(index, 1)
        }

        return category.save()
      })

    let deleteProductTasks = [
      delProdFromProdTable,
      delProdFromUserCreatedArr,
      delProdImageFile,
      delProdFromCategory
    ]

    Promise.all(deleteProductTasks)
      .then(result => {
        res.redirect(`/?success=${encodeURIComponent('Product was deleted successfully!')}`)
      })
      .catch(err => {
        res.redirect(`/?error=${encodeURIComponent('Something went wrong and product could not delete!')}`)
    })
  })
}

module.exports.buyGet = (req, res) => {
  let productId = req.params.id

  Product.findById(productId).then((product) => {
    if (!product) {
      res.sendStatus(404)
      return
    }

    if (product.buyer) {
      let error = `?error=${encodeURIComponent('Product was already bought!')}`
      res.redirect(`/${error}`)
      return
    }

    res.render('product/buy', {product})
  })
}

module.exports.buyPost = (req, res) => {
  let productId = req.params.id

  Product.findById(productId).then(product => {
    if (product.buyer) {
      let error = `?error=${encodeURIComponent('Product was already bought!')}`
      res.redirect(`/${error}`)
      return
    }

    product.buyer = req.user._id
    req.user.boughtProduct.push(productId)

    Promise.all([product.save(), req.user.save()])
      .then(() => {
        res.redirect('/')
      })
      .catch((err) => {
      console.log(err)
    })
  })
}