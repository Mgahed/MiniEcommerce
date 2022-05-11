const User = require('../models/user');
const bcrypt = require('bcryptjs');
const {transporter} = require('../util/mailer');
const crypto = require('crypto');
const {validationResult} = require("express-validator");
const path = require('path');
const ejs = require("ejs");

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login', pageTitle: 'Login', errorMessage: req.flash('error'), oldInput: {
            email: '',
        }, validationErrors: []
    });
};

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        path: '/signup', pageTitle: 'Signup', errorMessage: req.flash('error'), oldInput: {
            email: '',
        }, validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login', pageTitle: 'Login', errorMessage: errors.array()[0].msg, oldInput: {
                email: email,
            }, validationErrors: errors.array()
        });
    }
    User.findOne({email: email})
        .then((user) => {
            if (!user) {
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }
            bcrypt.compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            const mailOptions = {
                                from: 'The Idea project',
                                to: email,
                                subject: 'My first Email!!!',
                                html: "<h1 style='color:red'>This is my first email. I am so excited!</h1>"
                            };
                            res.redirect('/');
                            /*return transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    res.json(error);
                                } else {
                                    console.log('Email sent: ' + info.response);
                                }
                            });*/
                        });
                    }
                    req.flash('error', 'Invalid email or password.');
                    return res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });
        })
        .catch(err => {
            console.log(err);
            res.redirect('/login');
        });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup', pageTitle: 'Signup', errorMessage: errors.array()[0].msg, oldInput: {
                email: email,
            }, validationErrors: errors.array()
        });
    }
    User.findOne({email: email})
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'Email already exists.');
                return res.redirect('/signup');
            }
            crypto.randomBytes(32, (err, buffer) => {
                if (err) {
                    console.log(err);
                    return res.redirect('/signup');
                }
                let emailVerificationToken = buffer.toString('hex');
                let emailVerificationTokenExpiration = Date.now() + 3600000;
                bcrypt.hash(password, 12)
                    .then(hashedPassword => {
                        const user = new User({
                            email: email, password: hashedPassword, cart: {items: []}
                        });
                        user.emailVerificationToken = emailVerificationToken;
                        user.emailVerificationTokenExpiration = emailVerificationTokenExpiration;
                        user.isVerified = false;
                        return user.save();
                    })

                    .then(result => {
                        res.redirect('/login');
                        ejs.renderFile(path.join(__dirname, '../views/emailTemp/emailVerification.ejs'), {
                            user_firstname: email,
                            confirm_link: "http://localhost:3000/confirm-mail/" + email + '/' + emailVerificationToken
                        })
                            .then(result => {
                                emailTemplate = result;
                                const message = {
                                    to: email,
                                    from: {email: process.env.email, name: "MrTechnawy"},
                                    subject: "Confirm your email",
                                    html: emailTemplate
                                };
                                transporter.sendMail(message, (err, info) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log('Email sent: ' + info.response);
                                    }
                                });
                                //res.send(emailTemplate);
                            })
                            .catch(err => {
                                //req.flash('error', 'Error Rendering emailTemplate');
                                console.log(err);
                            });
                    })
                    .catch(err => {
                        console.log(err);
                    });
            });
        });
};

//confirm email
exports.confirmEmail = (req, res) => {
    const email = req.params.email;
    const emailVerificationToken = req.params.token;
    User.findOne({email: email})
        .then(userDoc => {
            if (!userDoc) {
                return res.redirect('/login');
            }
            if (userDoc.emailVerificationToken === emailVerificationToken && userDoc.emailVerificationTokenExpiration > Date.now()) {
                userDoc.isVerified = true;
                userDoc.emailVerificationToken = undefined;
                userDoc.emailVerificationTokenExpiration = undefined;
                userDoc.save()
                    .then(result => {
                        res.redirect('/login');
                    })
                    .catch(err => {
                        console.log(err);
                    });
            } else {
                req.flash('error', 'Link expired or invalid link');
                return res.redirect('/login');
            }
        });
};

exports.reSendVerifyView = (req, res) => {
    let message = 'Please verify your email address';
    res.render('auth/re-verify', {
        path: '/re-verify', pageTitle: 'Send Verification Email', errorMessage: message
    });
};

exports.reSendVerifyLink = (req, res) => {
    const email = req.body.email;
    User.findOne({email: email})
        .then(userDoc => {
            if (!userDoc) {
                //flash message
                req.flash('error', 'Email not found');
                return res.redirect('/signup');
            }
            if (userDoc.isVerified) {
                req.flash('error', 'Your email is already verified');
                return res.redirect('/login');
            }
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');
            const emailVerificationTokenExpiration = Date.now() + 3600000;
            userDoc.emailVerificationToken = emailVerificationToken;
            userDoc.emailVerificationTokenExpiration = emailVerificationTokenExpiration;
            userDoc.save()
                .then(result => {
                    res.redirect('/login');
                    ejs.renderFile(path.join(__dirname, '../views/emailTemp/emailVerification.ejs'), {
                        user_firstname: email,
                        confirm_link: "http://localhost:3000/confirm-mail/" + email + '/' + emailVerificationToken
                    })
                        .then(result => {
                            emailTemplate = result;
                            const message = {
                                to: email,
                                from: {email: process.env.email, name: "MrTechnawy"},
                                subject: "Confirm your email",
                                html: emailTemplate
                            };
                            transporter.sendMail(message, (err, info) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Email sent: ' + info.response);
                                }
                            });
                        })
                        .catch(err => {
                            console.log(err);
                        });
                })
                .catch(err => {
                    console.log(err);
                });
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
};

// get reset password view
exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    res.render('auth/reset', {
        path: '/reset', pageTitle: 'Reset Password', errorMessage: message
    });
};

// post reset password
exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/login');
                const mailOptions = {
                    from: {email: process.env.email, name: "MrTechnawy"},
                    to: req.body.email,
                    subject: 'Reset Password',
                    html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `
                };
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Email sent: ' + info.response + 'to' + req.body.email);
                    }
                });
            })
            .catch(err => {
                console.log(err);
            });
    });
};

//get new password view
exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            let message = req.flash('error');
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                message = 'Invalid or expired token';
                return res.redirect('/reset');
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            console.log(err);
        });
};

//post new password
exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User.findOne({
        resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
        });
};
