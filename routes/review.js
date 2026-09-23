
const express = require('express');

const router = express.Router();

const {
    body,
    param,
    validationResult
} = require('express-validator');

const Review = require('../modules/review');

const Product = require('../modules/product');

const Order = require('../modules/order');

const verifyToken = require('../middelware/verifyToken');


function checkValidation(req, res, next) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            errors: errors.array()
        });

    }

    next();
}


/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product review management endpoints
 */


/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Add a product review
 *     description: Adds a review for a product. The authenticated user must have purchased the product and can review it only once.
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - rating
 *               - comment
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *                 example: 68c123456789abcdef123456
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Excellent product and very good quality
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       403:
 *         description: User must purchase the product first
 *       404:
 *         description: Product not found
 *       409:
 *         description: User has already reviewed this product
 *       500:
 *         description: Internal server error
 */
router.post(

    '/',

    verifyToken,

    body('product')
        .isMongoId()
        .withMessage('Invalid product ID'),

    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),

    body('comment')
        .trim()
        .notEmpty()
        .withMessage('Comment is required'),

    checkValidation,

    async (req, res) => {

        try {

            const product = await Product.findById(req.body.product);

            if (!product) {

                return res.status(404).json({
                    message: 'Product not found'
                });

            }


            const existingReview = await Review.findOne({

                user: req.currentUser.userId,

                product: req.body.product

            });


            if (existingReview) {

                return res.status(409).json({
                    message: 'You already reviewed this product'
                });

            }


            const orders = await Order.find({

                user: req.currentUser.userId,

                'products.products': req.body.product

            });


            if (orders.length === 0) {

                return res.status(403).json({
                    message: 'You must purchase this product first'
                });

            }


            const review = await Review.create({

                user: req.currentUser.userId,

                product: req.body.product,

                rating: req.body.rating,

                comment: req.body.comment

            });


            return res.status(201).json({

                message: 'Review added successfully',

                review

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });

        }

    }

);


/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Get product reviews
 *     description: Returns all reviews for a specific product, sorted from newest to oldest.
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid product ID
 *       500:
 *         description: Internal server error
 */
router.get(

    '/product/:productId',

    param('productId')
        .isMongoId()
        .withMessage('Invalid product ID'),

    checkValidation,

    async (req, res) => {

        try {

            const reviews = await Review.find({

                product: req.params.productId

            })

            .populate('user', 'userName')

            .sort({ createdAt: -1 });


            return res.status(200).json({

                reviews

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });

        }

    }

);


/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     description: Deletes a review. Users can delete their own reviews, while admins can delete any review.
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Review ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       400:
 *         description: Invalid review ID
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       403:
 *         description: User is not allowed to delete this review
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.delete(

    '/:id',

    verifyToken,

    param('id')
        .isMongoId()
        .withMessage('Invalid review ID'),

    checkValidation,

    async (req, res) => {

        try {

            const review = await Review.findById(req.params.id);

            if (!review) {

                return res.status(404).json({
                    message: 'Review not found'
                });

            }


            if (

                review.user.toString() !==
                req.currentUser.userId &&

                req.currentUser.roles !== 'admin'

            ) {

                return res.status(403).json({
                    message: 'Not allowed'
                });

            }


            await review.deleteOne();


            return res.status(200).json({

                message: 'Review deleted successfully'

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });

        }

    }

);


module.exports = router;

