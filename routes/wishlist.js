
const express = require('express');

const router = express.Router();

const {
    body,
    param,
    validationResult
} = require('express-validator');

const Wishlist = require('../modules/wishlist');

const Product = require('../modules/product');

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
 *   name: Wishlist
 *   description: Wishlist management endpoints
 */


/**
 * @swagger
 * /wishlist/add:
 *   post:
 *     summary: Add a product to wishlist
 *     description: Adds a product to the authenticated user's wishlist.
 *     tags:
 *       - Wishlist
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
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *                 example: 68c123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       404:
 *         description: Product not found
 *       409:
 *         description: Product already exists in wishlist
 *       500:
 *         description: Internal server error
 */
router.post(

    '/add',

    verifyToken,

    body('product')
        .isMongoId()
        .withMessage('Invalid product ID'),

    checkValidation,

    async (req, res) => {

        try {

            const product = await Product.findById(req.body.product);

            if (!product) {

                return res.status(404).json({
                    message: 'Product not found'
                });

            }


            let wishlist = await Wishlist.findOne({

                user: req.currentUser.userId

            });


            if (!wishlist) {

                wishlist = await Wishlist.create({

                    user: req.currentUser.userId,

                    products: [req.body.product]

                });

            }

            else {

                if (wishlist.products.includes(req.body.product)) {

                    return res.status(409).json({
                        message: 'Product already exists in wishlist'
                    });

                }


                wishlist.products.push(req.body.product);

                await wishlist.save();

            }


            return res.status(200).json({

                message: 'Product added to wishlist',

                wishlist

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
 * /wishlist:
 *   get:
 *     summary: Get user wishlist
 *     description: Returns the wishlist of the authenticated user with populated product information.
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wishlist:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: string
 *                       example: 68c123456789abcdef123456
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get(

    '/',

    verifyToken,

    async (req, res) => {

        try {

            const wishlist = await Wishlist.findOne({

                user: req.currentUser.userId

            })

            .populate('products');


            if (!wishlist) {

                return res.status(200).json({

                    products: []

                });

            }


            return res.status(200).json({

                wishlist

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
 * /wishlist/remove/{productId}:
 *   delete:
 *     summary: Remove a product from wishlist
 *     description: Removes a product from the authenticated user's wishlist.
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Product ID to remove from wishlist
 *         schema:
 *           type: string
 *           example: 68c123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *       400:
 *         description: Invalid product ID
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       404:
 *         description: Wishlist not found
 *       500:
 *         description: Internal server error
 */
router.delete(

    '/remove/:productId',

    verifyToken,

    param('productId')
        .isMongoId()
        .withMessage('Invalid product ID'),

    checkValidation,

    async (req, res) => {

        try {

            const wishlist = await Wishlist.findOne({

                user: req.currentUser.userId

            });


            if (!wishlist) {

                return res.status(404).json({

                    message: 'Wishlist not found'

                });

            }


            wishlist.products =

                wishlist.products.filter(

                    product =>

                        product.toString() !==

                        req.params.productId

                );


            await wishlist.save();


            return res.status(200).json({

                message: 'Product removed from wishlist',

                wishlist

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });

        }

    }

);


module.exports = router;

