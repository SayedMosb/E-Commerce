const express = require('express');
const router = express.Router();

const Product = require('../modules/product');
const Order = require('../modules/order');
const User = require('../modules/user');

const verifyToken = require('../middelware/verifyToken');
const allowedTo = require('../middelware/allowsTo');


/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Returns overall statistics about products, users, orders, revenue, and low-stock products.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                       example: 10
 *                     totalUsers:
 *                       type: integer
 *                       example: 25
 *                     totalOrders:
 *                       type: integer
 *                       example: 50
 *                     pendingOrders:
 *                       type: integer
 *                       example: 8
 *                     deliveredOrders:
 *                       type: integer
 *                       example: 35
 *                     totalRevenue:
 *                       type: number
 *                       example: 15000
 *                 lowStockProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example: []
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
    '/',

    verifyToken,
    allowedTo('admin'),

    async (req, res) => {

        try {

            const totalProducts =
                await Product.countDocuments();


            const totalUsers =
                await User.countDocuments();


            const totalOrders =
                await Order.countDocuments();


            const pendingOrders =
                await Order.countDocuments({
                    status: 'pending'
                });


            const deliveredOrders =
                await Order.countDocuments({
                    status: 'delivered'
                });


            const revenueResult =
                await Order.aggregate([

                    {
                        $match: {
                            status: 'delivered'
                        }
                    },

                    {
                        $group: {
                            _id: null,
                            totalRevenue: {
                                $sum: '$totalPrice'
                            }
                        }
                    }

                ]);


            const totalRevenue =
                revenueResult.length > 0
                    ? revenueResult[0].totalRevenue
                    : 0;


            const lowStockProducts =
                await Product.find({
                    stock: {
                        $lte: 5
                    }
                });


            return res.status(200).json({

                statistics: {

                    totalProducts,

                    totalUsers,

                    totalOrders,

                    pendingOrders,

                    deliveredOrders,

                    totalRevenue

                },

                lowStockProducts

            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    }
);


module.exports = router;