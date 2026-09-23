
const appError = require('./appError.js');

module.exports = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.currentUser.roles)) {

            return next(
                appError.create(
                    'This role is not allowed',
                    403
                )
            );
        }

        next();
    };
};

