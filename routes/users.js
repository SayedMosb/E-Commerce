
var express = require('express');

var router = express.Router();

const bcrypt = require('bcrypt');

const JWT = require('jsonwebtoken');

const { body, validationResult } = require('express-validator');

const User = require('../modules/user');

const verifyToken = require('../middelware/verifyToken');

const allowedTo = require('../middelware/allowsTo');


// ==================== SIGNUP ====================

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 example: Sayed
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */

router.post(
    '/signup',

    body('userName')
        .notEmpty()
        .withMessage('Username is required'),

    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),

    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {

            const hash = await bcrypt.hash(
                req.body.password,
                10
            );

            const user = new User({
                userName: req.body.userName,
                email: req.body.email,
                password: hash
            });

            await user.save();

            return res.status(201).json({
                message: 'User created successfully'
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    }
);

// ==================== SIGNIN ====================

/**
 * @swagger
 * /users/signin:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 example: Sayed
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Wrong username or password
 */

router.post(
    '/signin',

    body('userName')
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {

            const user = await User.findOne({
                userName: req.body.userName
            });

            if (!user) {
                return res.status(401).json({
                    message: 'Wrong username or password'
                });
            }

            const result = await bcrypt.compare(
                req.body.password,
                user.password
            );

            if (!result) {
                return res.status(401).json({
                    message: 'Wrong username or password'
                });
            }


            // ==================== ACCESS TOKEN ====================

            const accessToken = JWT.sign(
                {
                    userId: user._id,
                    roles: user.roles
                },

                process.env.SECRET,

                {
                    expiresIn: '1h'
                }
            );


            // ==================== REFRESH TOKEN ====================

            const refreshToken = JWT.sign(
                {
                    userId: user._id
                },

                process.env.REFRESH_SECRET,

                {
                    expiresIn: '7d'
                }
            );


            // Save refresh token in database

            user.refreshToken = refreshToken;

            await user.save();


            return res.status(200).json({

                message: 'Success sign in',

                accessToken: accessToken,

                refreshToken: refreshToken

            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }
    }
);


// ==================== REFRESH TOKEN ====================

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Generate a new access token using refresh token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *       401:
 *         description: Invalid or expired refresh token
 */

router.post(
    '/refresh',

    async (req, res) => {

        try {

            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({
                    message: 'Refresh token is required'
                });
            }


            // Verify refresh token

            const decoded = JWT.verify(
                refreshToken,
                process.env.REFRESH_SECRET
            );


            // Find user with this refresh token

            const user = await User.findOne({
                _id: decoded.userId,
                refreshToken: refreshToken
            });


            if (!user) {
                return res.status(401).json({
                    message: 'Invalid refresh token'
                });
            }


            // Generate new access token

            const accessToken = JWT.sign(
                {
                    userId: user._id,
                    roles: user.roles
                },

                process.env.SECRET,

                {
                    expiresIn: '1h'
                }
            );


            return res.status(200).json({

                message: 'Access token refreshed successfully',

                accessToken: accessToken

            });

        } catch (err) {

            return res.status(401).json({
                message: 'Invalid or expired refresh token'
            });

        }
    }
);


// ==================== LOGOUT ====================

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Invalid refresh token
 */

router.post(
    '/logout',

    async (req, res) => {

        try {

            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({
                    message: 'Refresh token is required'
                });
            }


            const user = await User.findOne({
                refreshToken: refreshToken
            });


            if (!user) {
                return res.status(401).json({
                    message: 'Invalid refresh token'
                });
            }


            // Delete refresh token

            user.refreshToken = null;

            await user.save();


            return res.status(200).json({
                message: 'Logout successful'
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }
    }
);

// ==================== FORGOT PASSWORD ====================

router.post(
    '/forgot-password',

    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email'),

    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {

            const user = await User.findOne({
                email: req.body.email
            });

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            const resetToken = JWT.sign(
                {
                    userId: user._id
                },
                process.env.RESET_PASSWORD_SECRET,
                {
                    expiresIn: '10m'
                }
            );

            user.resetPasswordToken = resetToken;

            user.resetPasswordExpires = new Date(
                Date.now() + 10 * 60 * 1000
            );

            await user.save();

            return res.status(200).json({
                message: 'Reset password token generated successfully',
                resetToken: resetToken
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    }
);

// ==================== RESET PASSWORD ====================

router.post(
    '/reset-password/:token',

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),

    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {

            const decoded = JWT.verify(
                req.params.token,
                process.env.RESET_PASSWORD_SECRET
            );

            const user = await User.findOne({
                _id: decoded.userId,
                resetPasswordToken: req.params.token
            });

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid reset password token'
                });
            }

            if (
                !user.resetPasswordExpires ||
                user.resetPasswordExpires < new Date()
            ) {
                return res.status(400).json({
                    message: 'Reset password token has expired'
                });
            }

            const hash = await bcrypt.hash(
                req.body.password,
                10
            );

            user.password = hash;

            // Invalidate reset token after use
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;

            // Invalidate old refresh token
            user.refreshToken = null;

           await user.save();


           return res.status(200).json({
    message: 'Password reset successfully'
});

        } catch (err) {

            return res.status(400).json({
                message: 'Invalid or expired reset password token'
            });
        }
    }
);

// ==================== UPDATE USER ====================

router.patch(
    '/updateuser/:id',

    verifyToken,

    body('userName')
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),

    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {

            // المستخدم يقدر يعدل حسابه فقط
            // والـ admin يقدر يعدل أي user

            if (
                req.currentUser.userId.toString() !==
                req.params.id.toString() &&

                req.currentUser.roles !== 'admin'
            ) {

                return res.status(403).json({
                    message: 'You are not allowed to update this user'
                });

            }


            const hash = await bcrypt.hash(
                req.body.password,
                10
            );


            const updatedUser = {

                userName: req.body.userName,

                password: hash

            };


            const result = await User.findOneAndUpdate(

                { _id: req.params.id },

                { $set: updatedUser },

                { new: true }

            );


            if (!result) {

                return res.status(404).json({
                    message: 'User is not found to update'
                });

            }


            return res.status(200).json({
                message: 'User updated successfully'
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }
    }
);


// ==================== DELETE USER ====================

router.delete(
    '/deleteuser/:id',

    verifyToken,

    async (req, res) => {

        try {

            // المستخدم يحذف حسابه فقط
            // والـ admin يقدر يحذف أي user

            if (
                req.currentUser.userId.toString() !==
                req.params.id.toString() &&

                req.currentUser.roles !== 'admin'
            ) {

                return res.status(403).json({
                    message: 'You are not allowed to delete this user'
                });

            }


            const user = await User.findOneAndDelete({

                _id: req.params.id

            });


            if (!user) {

                return res.status(404).json({
                    message: 'User is not found to delete'
                });

            }


            return res.status(200).json({
                message: 'User deleted successfully'
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }
    }
);


module.exports = router;
