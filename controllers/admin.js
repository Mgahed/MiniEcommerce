const Product = require('../models/product');
const fileHelper = require('../util/file');
const {resize} = require('../util/resize');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: '',
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attach an image'
    });
  }

  resize(image, 'products', 200, 200)
    .then(() => {
      fileHelper.deleteFile(req.file.path)

      const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: req.file.destination + '/products/' + image.filename,
        userId: req.user
      });
      product.save()
        .then(result => {
          // console.log(result);
          console.log('Created Product');
          res.redirect('/admin/products');
        })
        .catch(err => {
          console.log(err);
        });

    })
    .catch(err => {
      console.log("not resized =>>>>>>>>> " + err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: ''
      });
    })
    .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: 'Attach an image'
    });
  }

  resize(image, 'products', 200, 200)
    .then(() => {
      console.log('Resized image');
      fileHelper.deleteFile(req.file.path)

      Product.findById(prodId)
        .then(product => {
          if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
          }
          fileHelper.deleteFile(product.imageUrl);
          product.title = updatedTitle;
          product.price = updatedPrice;
          product.description = updatedDesc;
          product.imageUrl = req.file.destination + '/products/' + image.filename;
          return product.save();
        })
        .then(result => {
          console.log('UPDATED PRODUCT!');
          res.redirect('/admin/products');
        })
        .catch(err => console.log(err));

    })
    .catch(err => {
      console.log("not resized =>>>>>>>>> " + err);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};

exports.DeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id: prodId, userId: req.user._id})
        .then(() => {
          console.log('DESTROYED PRODUCT');
          /*res.redirect('/admin/products');*/
          res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
          })
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};
