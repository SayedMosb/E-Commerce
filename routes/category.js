
const express = require('express');

const router = express.Router();

const {
    body,
    param,
    validationResult
} = require('express-validator');

const Category = require('../modules/category');

const verifyToken = require('../middelware/verifyToken');

const allowedTo = require('../middelware/allowsTo');


// ==================== Validation ====================

function checkValidation(req, res, next) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    next();
}


// ==================== GET ALL CATEGORIES ====================

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {

    try {

        const categories = await Category.find({});

        return res.status(200).json({
            categories
        });

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

    }
});


// ==================== GET CATEGORY BY ID ====================

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       400:
 *         description: Invalid category ID
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get(
    '/:id',

    param('id')
        .isMongoId()
        .withMessage('Invalid category ID'),

    checkValidation,

    async (req, res) => {

        try {

            const category = await Category.findById(req.params.id);

            if (!category) {
                return res.status(404).json({
                    message: 'Category not found'
                });
            }

            return res.status(200).json({
                category
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }
    }
);


// ==================== ADD CATEGORY ====================

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Add a new category
 *     tags:
 *       - Categories
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: Electronic devices and accessories
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Category already exists
 *       500:
 *         description: Server error
 */
router.post(
    '/',

    verifyToken,

    allowedTo('admin'),

    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),

    checkValidation,

    async (req, res) => {

        try {

            const existingCategory = await Category.findOne({
                name: req.body.name
            });

            if (existingCategory) {
                return res.status(409).json({
                    message: 'Category already exists'
                });
            }

            const category = await Category.create({
                name: req.body.name,
                description: req.body.description
            });

            return res.status(201).json({
                message: 'Category created successfully',
                category
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }
    }
);


// ==================== UPDATE CATEGORY ====================

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update a category
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Electronics
 *               description:
 *                 type: string
 *                 example: Updated category description
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id',

    verifyToken,

    allowedTo('admin'),

    param('id')
        .isMongoId()
        .withMessage('Invalid category ID'),

    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category name cannot be empty'),

    body('description')
        .optional()
        .isString(),

    checkValidation,

    async (req, res) => {

        try {

            const category = await Category.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!category) {
                return res.status(404).json({
                    message: 'Category not found'
                });
            }

            return res.status(200).json({
                message: 'Category updated successfully',
                category
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }
    }
);


// ==================== DELETE CATEGORY ====================

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Invalid category ID
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',

    verifyToken,

    allowedTo('admin'),

    param('id')
        .isMongoId()
        .withMessage('Invalid category ID'),

    checkValidation,

    async (req, res) => {

        try {

            const category = await Category.findByIdAndDelete(
                req.params.id
            );

            if (!category) {
                return res.status(404).json({
                    message: 'Category not found'
                });
            }

            return res.status(200).json({
                message: 'Category deleted successfully'
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }
    }
);


module.exports = router;

