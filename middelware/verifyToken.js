
const JWT = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Token is required'
        });
    }

    const token = authHeader.split(' ')[1];

    try {

        const currentUser = JWT.verify(
            token,
            process.env.SECRET
        );

        req.currentUser = currentUser;

        next();

    } catch (err) {

        return res.status(401).json({
            message: 'Invalid token'
        });
    }
};

module.exports = verifyToken;
