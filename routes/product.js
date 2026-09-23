
const express = require('express');

const router = express.Router();

const {
    query,
    body,
    param,
    validationResult
} = require('express-validator');

const verifyToken = require('../middelware/verifyToken');
const allowedTo = require('../middelware/allowsTo');
const Product = require('../modules/product');


// ==================== GET ALL PRODUCTS ====================
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       404:
 *         description: No products found
 */
router.get(
    '/',

    // Search Validation
    query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string')
        .trim(),

    // Min Price Validation
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage(
            'minPrice must be a number greater than or equal to 0'
        ),

    // Max Price Validation
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage(
            'maxPrice must be a number greater than or equal to 0'
        ),

    // Page Validation
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage(
            'Page must be an integer greater than 0'
        ),

    // Limit Validation
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage(
            'Limit must be between 1 and 100'
        ),

    // Sort Validation
    query('sort')
        .optional()
        .isIn([
            'price_asc',
            'price_desc'
        ])
        .withMessage(
            'Sort must be price_asc or price_desc'
        ),

    async (req, res) => {

        try {

            // ==================== VALIDATION ====================

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array()
                });
            }


            // ==================== CHECK PRICE RANGE ====================

            if (
                req.query.minPrice &&
                req.query.maxPrice &&
                Number(req.query.minPrice) >
                Number(req.query.maxPrice)
            ) {

                return res.status(400).json({
                    message:
                        'minPrice cannot be greater than maxPrice'
                });

            }


            // ==================== QUERY ====================

            const queryObject = {};


            // ==================== SEARCH ====================

            if (req.query.search) {

                queryObject.name = {
                    $regex: req.query.search,
                    $options: 'i'
                };

            }


            // ==================== FILTER ====================

            if (
                req.query.minPrice ||
                req.query.maxPrice
            ) {

                queryObject.price = {};

                if (req.query.minPrice) {

                    queryObject.price.$gte =
                        Number(req.query.minPrice);

                }

                if (req.query.maxPrice) {

                    queryObject.price.$lte =
                        Number(req.query.maxPrice);

                }

            }


            // ==================== PAGINATION ====================

            const page =
                Number(req.query.page) || 1;

            const limit =
                Number(req.query.limit) || 10;

            const skip =
                (page - 1) * limit;


            // ==================== SORT ====================

            let sort = {};

            if (req.query.sort === 'price_asc') {

                sort.price = 1;

            } else if (req.query.sort === 'price_desc') {

                sort.price = -1;

            }


            // ==================== DATABASE ====================

            const products =
                await Product.find(queryObject)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit);


            // ==================== TOTAL PRODUCTS ====================

            const totalProducts =
                await Product.countDocuments(queryObject);


            // ==================== TOTAL PAGES ====================

            const totalPages =
                Math.ceil(totalProducts / limit);


            // ==================== RESPONSE ====================

            return res.status(200).json({

                page,
                limit,
                totalProducts,
                totalPages,
                count: products.length,
                products

            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }

    }
);


// ==================== GET PRODUCT BY ID ====================
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6ab31923e427ba057d95d582
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get(
    '/:id',

    param('id')
        .isMongoId()
        .withMessage('Invalid product ID'),

    async (req, res) => {

        try {

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array()
                });
            }


            const product =
                await Product.findById(req.params.id);


            if (!product) {

                return res.status(404).json({
                    message: 'Product not found'
                });

            }


            return res.status(200).json({
                product
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }

    }
);


// ==================== ADD PRODUCT ====================
/**
 * @swagger
 * /products/addproduct:
 *   post:
 *     summary: Add a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15 Pro
 *               price:
 *                 type: number
 *                 example: 55000
 *               stock:
 *                 type: number
 *                 example: 15
 *     responses:
 *       201:
 *         description: Product created successfully
 *       403:
 *         description: Admin access required
 */
router.post(
    '/addproduct',

    verifyToken,
    allowedTo('admin'),


    // Product Name Validation

    body('name')
        .notEmpty()
        .withMessage('Product name is required')
        .isString()
        .withMessage('Product name must be a string')
        .trim(),


    // Product Price Validation

    body('price')
        .notEmpty()
        .withMessage('Product price is required')
        .isFloat({ gt: 0 })
        .withMessage(
            'Product price must be greater than 0'
        ),


    // Product Stock Validation

    body('stock')
        .notEmpty()
        .withMessage('Product stock is required')
        .isInt({ min: 0 })
        .withMessage(
            'Product stock must be 0 or greater'
        ),


    async (req, res) => {

        // ==================== VALIDATION ====================

        const errors =
            validationResult(req);

        if (!errors.isEmpty()) {

            return res.status(400).json({
                errors: errors.array()
            });

        }


        try {

            // ==================== CREATE PRODUCT ====================

            const product =
                await Product.create({

                    name: req.body.name,

                    price: req.body.price,

                    stock: req.body.stock

                });


            return res.status(201).json({

                message:
                    'Product added successfully',

                product

            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }

    }
);


// ==================== UPDATE PRODUCT ====================
/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6ab31923e427ba057d95d582
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15 Pro Max
 *               price:
 *                 type: number
 *                 example: 60000
 *               stock:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product not found
 */
router.patch(
    '/:productID',

    verifyToken,
    allowedTo('admin'),


    // Product ID Validation

    param('productID')
        .isMongoId()
        .withMessage('Invalid product ID'),


    // Product Name Validation

    body('name')
        .notEmpty()
        .withMessage('Product name is required')
        .isString()
        .withMessage('Product name must be a string')
        .trim(),


    // Product Price Validation

    body('price')
        .notEmpty()
        .withMessage('Product price is required')
        .isFloat({ gt: 0 })
        .withMessage(
            'Product price must be greater than 0'
        ),


    // Product Stock Validation

    body('stock')
        .notEmpty()
        .withMessage('Product stock is required')
        .isInt({ min: 0 })
        .withMessage(
            'Product stock must be 0 or greater'
        ),


    async (req, res) => {

        // ==================== VALIDATION ====================

        const errors =
            validationResult(req);

        if (!errors.isEmpty()) {

            return res.status(400).json({
                errors: errors.array()
            });

        }


        try {

            // ==================== UPDATE PRODUCT ====================

            const updatedProduct =
                await Product.findByIdAndUpdate(

                    req.params.productID,

                    {
                        name: req.body.name,

                        price: req.body.price,

                        stock: req.body.stock
                    },

                    {
                        new: true
                    }

                );


            if (!updatedProduct) {

                return res.status(404).json({
                    message:
                        'Product not found'
                });

            }


            return res.status(200).json({

                message:
                    'Product updated successfully',

                product: updatedProduct

            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }

    }
);


// ==================== DELETE PRODUCT ====================
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product not found
 */
router.delete(
    '/:id',

    verifyToken,
    allowedTo('admin'),

    param('id')
        .isMongoId()
        .withMessage('Invalid product ID'),

    async (req, res) => {

        try {

            // ==================== VALIDATION ====================

            const errors =
                validationResult(req);

            if (!errors.isEmpty()) {

                return res.status(400).json({
                    errors: errors.array()
                });

            }


            // ==================== DELETE PRODUCT ====================

            const deletedProduct =
                await Product.findByIdAndDelete(
                    req.params.id
                );


            if (!deletedProduct) {

                return res.status(404).json({
                    message:
                        'Product not found'
                });

            }


            return res.status(200).json({

                message:
                    'Product deleted successfully'

            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }

    }
);


module.exports = router;
