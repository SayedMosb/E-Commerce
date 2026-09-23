
const express = require('express');

const router = express.Router();

const {
    body,
    validationResult
} = require('express-validator');

const Payment = require('../modules/payment');

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
 * /payments:
 *   post:
 *     summary: Create a payment
 *     description: Creates a payment record for an order belonging to the authenticated user.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order
 *               - method
 *             properties:
 *               order:
 *                 type: string
 *                 description: ID of the order
 *                 example: 68c123456789abcdef123456
 *               method:
 *                 type: string
 *                 enum:
 *                   - cash
 *                   - card
 *                   - wallet
 *                 example: cash
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment created
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       404:
 *         description: Order not found
 *       409:
 *         description: Payment already exists for this order
 *       500:
 *         description: Internal server error
 */
router.post(

    '/',

    verifyToken,

    body('order')
        .isMongoId(),

    body('method')
        .isIn(['cash', 'card', 'wallet']),

    checkValidation,

    async (req, res) => {

        try {

            const order = await Order.findOne({

                _id: req.body.order,

                user: req.currentUser.userId

            });


            if (!order) {

                return res.status(404).json({
                    message: 'Order not found'
                });

            }


            const existingPayment = await Payment.findOne({

                order: order._id

            });


            if (existingPayment) {

                return res.status(409).json({
                    message: 'Payment already exists'
                });

            }


            const payment = await Payment.create({

                user: req.currentUser.userId,

                order: order._id,

                amount: order.totalPrice,

                method: req.body.method,

                status:
                    req.body.method === 'cash'
                        ? 'pending'
                        : 'pending'

            });


            return res.status(201).json({

                message: 'Payment created',

                payment

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
 * /payments:
 *   get:
 *     summary: Get user payments
 *     description: Returns all payments belonging to the authenticated user.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
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

            const payments = await Payment.find({

                user: req.currentUser.userId

            })

            .populate('order');


            return res.status(200).json({

                payments

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });

        }

    }

);


module.exports = router;

