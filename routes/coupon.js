
const express = require('express');

const router = express.Router();

const {
    body,
    param,
    validationResult
} = require('express-validator');

const Coupon = require('../modules/coupon');

const verifyToken = require('../middelware/verifyToken');

const allowedTo = require('../middelware/allowsTo');


function checkValidation(req, res, next) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    next();
}


// ==================== CREATE COUPON ====================

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags:
 *       - Coupons
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountPercentage
 *               - expiresAt
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE20
 *               discountPercentage:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 20
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-12-31T23:59:59.000Z
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post(
    '/',

    verifyToken,

    allowedTo('admin'),

    body('code')
        .notEmpty(),

    body('discountPercentage')
        .isFloat({
            min: 1,
            max: 100
        }),

    body('expiresAt')
        .isISO8601(),

    checkValidation,

    async (req, res) => {

        try {

            const coupon = await Coupon.create({

                code: req.body.code.toUpperCase(),

                discountPercentage:
                    req.body.discountPercentage,

                expiresAt:
                    req.body.expiresAt

            });


            return res.status(201).json({

                message:
                    'Coupon created successfully',

                coupon

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });
        }
    }
);


// ==================== CHECK COUPON ====================

/**
 * @swagger
 * /coupons/apply:
 *   post:
 *     summary: Check if a coupon is valid
 *     tags:
 *       - Coupons
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE20
 *     responses:
 *       200:
 *         description: Coupon is valid
 *       400:
 *         description: Coupon expired
 *       401:
 *         description: Invalid or missing token
 *       404:
 *         description: Invalid coupon
 *       500:
 *         description: Server error
 */
router.post(
    '/apply',

    verifyToken,

    body('code')
        .notEmpty(),

    checkValidation,

    async (req, res) => {

        try {

            const coupon = await Coupon.findOne({

                code: req.body.code.toUpperCase(),

                isActive: true

            });


            if (!coupon) {

                return res.status(404).json({

                    message: 'Invalid coupon'

                });
            }


            if (new Date() > coupon.expiresAt) {

                return res.status(400).json({

                    message: 'Coupon expired'

                });
            }


            return res.status(200).json({

                message: 'Coupon is valid',

                discountPercentage:
                    coupon.discountPercentage

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });
        }
    }
);


// ==================== DELETE COUPON ====================

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Delete a coupon
 *     tags:
 *       - Coupons
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *       400:
 *         description: Invalid coupon ID
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Coupon not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',

    verifyToken,

    allowedTo('admin'),

    param('id')
        .isMongoId(),

    checkValidation,

    async (req, res) => {

        try {

            const coupon = await Coupon.findByIdAndDelete(
                req.params.id
            );


            if (!coupon) {

                return res.status(404).json({

                    message: 'Coupon not found'

                });
            }


            return res.status(200).json({

                message:
                    'Coupon deleted successfully'

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });
        }
    }
);


module.exports = router;
