const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/isAuth');
const {isVerified} = require("../middleware/isVerified");

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, isVerified, shopController.getCart);

router.post('/cart', isAuth, isVerified, shopController.postCart);

router.post('/cart-delete-item', isAuth, isVerified, shopController.postCartDeleteProduct);

router.get('/checkout', isAuth, isVerified, shopController.getCheckout);

router.get('/checkout/success', isAuth, isVerified, shopController.getCheckoutSuccess);

router.get('/checkout/cancel', isAuth, isVerified, shopController.getCheckout);

router.post('/create-order', isAuth, isVerified, shopController.postOrder);

router.get('/orders', isAuth, isVerified, shopController.getOrders);

module.exports = router;
