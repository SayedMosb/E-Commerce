const express = require('express');

const router = express.Router();

const {
    body,
    param,
    validationResult
} = require('express-validator');

const verifyToken = require('../middelware/verifyToken');

const allowedTo = require('../middelware/allowsTo');

const Order = require('../modules/order');

const Product = require('../modules/product');


/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */


/**
 * @swagger
 * /order:
 *   get:
 *     summary: Get orders
 *     description: Admins can see all orders, while regular users can see only their own orders.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       404:
 *         description: No orders found
 *       500:
 *         description: Internal server error
 */
router.get('/', verifyToken, async (req, res) => {

    try {

        let orders;

        // Admin can see all orders
        if (req.currentUser.roles === 'admin') {

            orders = await Order.find({});

        }

        // User can see only his orders
        else {

            orders = await Order.find({
                user: req.currentUser.userId
            });

        }

        if (orders.length === 0) {

            return res.status(404).json({
                message: 'No orders found'
            });

        }

        return res.status(200).json({
            orders
        });

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

    }

});


/**
 * @swagger
 * /order/addorder:
 *   post:
 *     summary: Create a new order
 *     description: Creates an order for the authenticated user and decreases product stock.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - products
 *             properties:
 *               products:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - products
 *                     - quantity
 *                   properties:
 *                     products:
 *                       type: string
 *                       example: 68c123456789abcdef123456
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post(
    '/addorder',

    verifyToken,

    body('products')
        .isArray({ min: 1 })
        .withMessage('Products must be a non-empty array'),

    body('products.*.products')
        .isMongoId()
        .withMessage('Invalid product ID'),

    body('products.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),

    async (req, res) => {

        // ==================== VALIDATION ====================

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return res.status(400).json({
                errors: errors.array()
            });

        }

        try {

            const orderProducts = req.body.products;

            const products = [];

            let totalPrice = 0;


            // ==================== CHECK PRODUCTS & STOCK ====================

            for (let i = 0; i < orderProducts.length; i++) {

                const productId = orderProducts[i].products;

                const quantity = orderProducts[i].quantity;

                const product = await Product.findById(productId);


                // Product doesn't exist

                if (!product) {

                    return res.status(404).json({
                        message: `Product ${productId} not found`
                    });

                }


                // Check stock

                if (quantity > product.stock) {

                    return res.status(400).json({
                        message:
                            `Not enough stock for product ${product.name}. Available stock: ${product.stock}`
                    });

                }


                const price = product.price;

                const productTotal = price * quantity;

                totalPrice += productTotal;


                products.push({

                    products: product._id,

                    quantity: quantity,

                    price: price

                });

            }


            // ==================== CREATE ORDER ====================

            const newOrder = await Order.create({

                user: req.currentUser.userId,

                products: products,

                totalPrice: totalPrice

            });


            // ==================== DECREASE STOCK ====================

            for (let i = 0; i < orderProducts.length; i++) {

                const productId = orderProducts[i].products;

                const quantity = orderProducts[i].quantity;

                await Product.findByIdAndUpdate(

                    productId,

                    {
                        $inc: {
                            stock: -quantity
                        }
                    }

                );

            }


            return res.status(201).json({

                message: 'Order created successfully',

                data: newOrder

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
 * /order/{id}:
 *   patch:
 *     summary: Update an order
 *     description: Adds products or increases product quantities in an existing order. Users can update their own orders and admins can update any order.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - products
 *             properties:
 *               products:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - products
 *                     - quantity
 *                   properties:
 *                     products:
 *                       type: string
 *                       example: 68c123456789abcdef123456
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 1
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: You are not allowed to update this order
 *       404:
 *         description: Order or product not found
 *       500:
 *         description: Internal server error
 */
router.patch(
    '/:id',

    verifyToken,

    param('id')
        .isMongoId()
        .withMessage('Invalid order ID'),

    body('products')
        .isArray({ min: 1 })
        .withMessage('Products must be a non-empty array'),

    body('products.*.products')
        .isMongoId()
        .withMessage('Invalid product ID'),

    body('products.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),

    async (req, res) => {

        // ==================== VALIDATION ====================

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return res.status(400).json({
                errors: errors.array()
            });

        }

        try {

            // ==================== FIND ORDER ====================

            const order = await Order.findById(req.params.id);

            if (!order) {

                return res.status(404).json({
                    message: 'Order not found'
                });

            }


            // ==================== AUTHORIZATION ====================

            // User can update his own order
            // Admin can update any order

            if (

                order.user.toString() !==
                req.currentUser.userId.toString()

                &&

                req.currentUser.roles !== 'admin'

            ) {

                return res.status(403).json({
                    message:
                        'You are not allowed to update this order'
                });

            }


            // ==================== UPDATE PRODUCTS ====================

            const newProducts = req.body.products;


            for (let i = 0; i < newProducts.length; i++) {

                const productId = newProducts[i].products;

                const quantity = newProducts[i].quantity;


                // Find product in database

                const product = await Product.findById(productId);


                if (!product) {

                    return res.status(404).json({
                        message:
                            `Product ${productId} not found`
                    });

                }


                // Check if product already exists in order

                const existingProduct = order.products.find(

                    item =>
                        item.products.toString() ===
                        productId.toString()

                );


                if (existingProduct) {

                    // Check stock for the NEW quantity

                    if (quantity > product.stock) {

                        return res.status(400).json({
                            message:
                                `Not enough stock for product ${product.name}. Available stock: ${product.stock}`
                        });

                    }


                    // Increase quantity

                    existingProduct.quantity += quantity;


                    // Decrease stock

                    product.stock -= quantity;

                    await product.save();

                }


                else {

                    // Product does not exist in order

                    // Check stock

                    if (quantity > product.stock) {

                        return res.status(400).json({
                            message:
                                `Not enough stock for product ${product.name}. Available stock: ${product.stock}`
                        });

                    }


                    // Add product to order

                    order.products.push({

                        products: product._id,

                        quantity: quantity,

                        price: product.price

                    });


                    // Decrease stock

                    product.stock -= quantity;

                    await product.save();

                }

            }


            // ==================== RECALCULATE TOTAL PRICE ====================

            let totalPrice = 0;


            for (let i = 0; i < order.products.length; i++) {

                totalPrice +=
                    order.products[i].price *
                    order.products[i].quantity;

            }


            order.totalPrice = totalPrice;


            // ==================== SAVE ORDER ====================

            const updatedOrder = await order.save();


            return res.status(200).json({

                message: 'Order updated successfully',

                data: updatedOrder

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
 * /order/{id}:
 *   delete:
 *     summary: Delete an order
 *     description: Deletes an order and restores its products stock. Users can delete their own orders and admins can delete any order.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully and stock restored
 *       400:
 *         description: Order cannot be deleted because of its status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: You are not allowed to delete this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.delete(
    '/:id',

    verifyToken,

    param('id')
        .isMongoId()
        .withMessage('Invalid order ID'),

    async (req, res) => {

        try {

            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                return res.status(400).json({
                    errors: errors.array()
                });

            }


            // ==================== FIND ORDER ====================

            const order = await Order.findById(req.params.id);

            if (!order) {

                return res.status(404).json({
                    message: 'Order not found'
                });

            }


            // ==================== AUTHORIZATION ====================

            // User can delete his own order
            // Admin can delete any order

            if (

                order.user.toString() !==
                req.currentUser.userId.toString()

                &&

                req.currentUser.roles !== 'admin'

            ) {

                return res.status(403).json({
                    message:
                        'You are not allowed to delete this order'
                });

            }


            // ==================== CHECK ORDER STATUS ====================

            if (

                order.status === 'shipped' ||

                order.status === 'delivered'

            ) {

                return res.status(400).json({
                    message:
                        'You cannot delete an order that has been shipped or delivered'
                });

            }


            if (order.status === 'cancelled') {

                return res.status(400).json({
                    message:
                        'Order is already cancelled'
                });

            }


            // ==================== RETURN STOCK ====================

            for (let i = 0; i < order.products.length; i++) {

                const orderProduct = order.products[i];

                await Product.findByIdAndUpdate(

                    orderProduct.products,

                    {
                        $inc: {
                            stock: orderProduct.quantity
                        }
                    }

                );

            }


            // ==================== DELETE ORDER ====================

            await Order.findByIdAndDelete(req.params.id);


            return res.status(200).json({

                message:
                    'Order deleted successfully and stock restored'

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
 * /order/status/{id}:
 *   patch:
 *     summary: Update order status
 *     description: Allows admins to change the status of an order.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - confirmed
 *                   - shipped
 *                   - delivered
 *                   - cancelled
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.patch(
    '/status/:id',

    verifyToken,

    allowedTo('admin'),

    param('id')
        .isMongoId()
        .withMessage('Invalid order ID'),

    body('status')
        .isIn([
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled'
        ])
        .withMessage('Invalid order status'),

    async (req, res) => {

        try {

            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                return res.status(400).json({
                    errors: errors.array()
                });

            }


            const order = await Order.findById(req.params.id);


            if (!order) {

                return res.status(404).json({
                    message: 'Order not found'
                });

            }


            order.status = req.body.status;


            const updatedOrder = await order.save();


            return res.status(200).json({

                message:
                    'Order status updated successfully',

                order: updatedOrder

            });


        } catch (err) {

            return res.status(500).json({
                message: err.message
            });

        }

    }

);


module.exports = router;

