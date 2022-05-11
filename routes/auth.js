const express = require('express');
const {check, body} = require('express-validator');

const validator = [
    check('email').isEmail().withMessage("Invalid email"),
    body('password', 'Password must be at least 5 characters long with characters and numbers').isLength({min: 5}).isAlphanumeric(),
    body('confirmPassword').custom((value, {req}) => {
        if (value && value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', validator, authController.postLogin);

router.post('/signup', validator, authController.postSignup);

router.get('/confirm-mail/:email/:token', authController.confirmEmail);

router.get('/re-verify', authController.reSendVerifyView);

router.post('/re-verify', authController.reSendVerifyLink);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;