// exports if email verified
exports.isVerified = (req, res, next) => {
    if (req.user.isVerified) {
        return next();
    }
    //go to login page
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/re-verify');
    });
};
