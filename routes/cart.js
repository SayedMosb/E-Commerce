const express = require('express');

const router = express.Router();

const {
    body,
    param,
    validationResult
} = require('express-validator');

const verifyToken = require('../middelware/verifyToken');

const Cart = require('../modules/cart');

const Product = require('../modules/product');

const Order = require('../modules/order');


// ==================== ADD TO CART ====================

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add a product to the cart
 *     tags:
 *       - Cart
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
 *               - quantity
 *             properties:
 *               product:
 *                 type: string
 *                 example: 68c123456789abcdef123456
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Product added to cart and cart created
 *       200:
 *         description: Product added to existing cart
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Invalid or missing token
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post(
    '/add',
    verifyToken,

    body('product')
        .isMongoId()
        .withMessage('Invalid product ID'),

    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),

    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {

            const productId = req.body.product;

            const quantity = req.body.quantity;


            // ==================== FIND PRODUCT ====================

            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }


            // ==================== CHECK STOCK ====================

            if (quantity > product.stock) {
                return res.status(400).json({
                    message:
                        `Not enough stock. Available stock: ${product.stock}`
                });
            }


            // ==================== FIND USER CART ====================

            let cart = await Cart.findOne({
                user: req.currentUser.userId
            });


            // ==================== CREATE CART ====================

            if (!cart) {

                cart = await Cart.create({
                    user: req.currentUser.userId,

                    products: [
                        {
                            product: product._id,
                            quantity: quantity
                        }
                    ],

                    totalPrice:
                        product.price * quantity
                });

                return res.status(201).json({
                    message: 'Product added to cart',
                    cart
                });
            }


            // ==================== CHECK PRODUCT IN CART ====================

            const existingProduct = cart.products.find(
                item =>
                    item.product.toString() ===
                    productId.toString()
            );


            if (existingProduct) {

                const newQuantity =
                    existingProduct.quantity + quantity;


                // Check stock for total quantity

                if (newQuantity > product.stock) {
                    return res.status(400).json({
                        message:
                            `Not enough stock. Available stock: ${product.stock}`
                    });
                }

                existingProduct.quantity = newQuantity;

            } else {

                cart.products.push({
                    product: product._id,
                    quantity: quantity
                });
            }


            // ==================== RECALCULATE TOTAL ====================

            let totalPrice = 0;

            for (let i = 0; i < cart.products.length; i++) {

                const cartProduct = await Product.findById(
                    cart.products[i].product
                );

                if (cartProduct) {

                    totalPrice +=
                        cartProduct.price *
                        cart.products[i].quantity;
                }
            }

            cart.totalPrice = totalPrice;


            // ==================== SAVE CART ====================

            await cart.save();


            return res.status(200).json({
                message: 'Product added to cart',
                cart
            });


        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    }
);


// ==================== GET CART ====================

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get the current user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Invalid or missing token
 *       404:
 *         description: Cart is empty
 *       500:
 *         description: Server error
 */
router.get(
    '/',
    verifyToken,

    async (req, res) => {

        try {

            // ==================== FIND USER CART ====================

            const cart = await Cart.findOne({
                user: req.currentUser.userId
            }).populate(
                'products.product'
            );


            // ==================== CART NOT FOUND ====================

            if (!cart) {
                return res.status(404).json({
                    message: 'Cart is empty'
                });
            }


            // ==================== RECALCULATE TOTAL ====================

            let totalPrice = 0;

            for (let i = 0; i < cart.products.length; i++) {

                const product = cart.products[i].product;

                if (product) {

                    totalPrice +=
                        product.price *
                        cart.products[i].quantity;
                }
            }

            cart.totalPrice = totalPrice;

            await cart.save();


            // ==================== RESPONSE ====================

            return res.status(200).json({
                message: 'Cart retrieved successfully',
                cart
            });


        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    }
);


// ==================== UPDATE CART QUANTITY ====================

/**
 * @swagger
 * /cart/update/{productId}:
 *   patch:
 *     summary: Update product quantity in the cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart quantity updated successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Invalid or missing token
 *       404:
 *         description: Cart or product not found
 *       500:
 *         description: Server error
 */
router.patch(
    '/update/:productId',

    verifyToken,

    param('productId')
        .isMongoId()
        .withMessage('Invalid product ID'),

    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),

    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {

            const productId = req.params.productId;

            const quantity = req.body.quantity;


            const cart = await Cart.findOne({
                user: req.currentUser.userId
            });

            if (!cart) {
                return res.status(404).json({
                    message: 'Cart not found'
                });
            }


            const cartProduct = cart.products.find(
                item =>
                    item.product.toString() ===
                    productId.toString()
            );


            if (!cartProduct) {
                return res.status(404).json({
                    message: 'Product not found in cart'
                });
            }


            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }


            // Check stock

            if (quantity > product.stock) {
                return res.status(400).json({
                    message:
                        `Not enough stock. Available stock: ${product.stock}`
                });
            }


            cartProduct.quantity = quantity;


            // Recalculate total

            let totalPrice = 0;

            for (let i = 0; i < cart.products.length; i++) {

                const currentProduct = await Product.findById(
                    cart.products[i].product
                );

                if (currentProduct) {

                    totalPrice +=
                        currentProduct.price *
                        cart.products[i].quantity;
                }
            }

            cart.totalPrice = totalPrice;


            await cart.save();


            return res.status(200).json({
                message: 'Cart quantity updated successfully',
                cart
            });


        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    }
);


// ==================== CHECKOUT CART ====================

/**
 * @swagger
 * /cart/checkout:
 *   post:
 *     summary: Checkout the current user's cart and create an order
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully from cart
 *       400:
 *         description: Cart is empty or insufficient stock
 *       401:
 *         description: Invalid or missing token
 *       404:
 *         description: Cart or product not found
 *       500:
 *         description: Server error
 */
router.post(
    '/checkout',

    verifyToken,

    async (req, res) => {

        try {

            // ==================== FIND CART ====================

            const cart = await Cart.findOne({
                user: req.currentUser.userId
            });


            if (!cart) {
                return res.status(404).json({
                    message: 'Cart not found'
                });
            }


            // ==================== CHECK CART ====================

            if (cart.products.length === 0) {
                return res.status(400).json({
                    message: 'Cart is empty'
                });
            }


            const orderProducts = [];

            let totalPrice = 0;


            // ==================== CHECK PRODUCTS & STOCK ====================

            for (let i = 0; i < cart.products.length; i++) {

                const cartProduct = cart.products[i];

                const product = await Product.findById(
                    cartProduct.product
                );


                // Product doesn't exist

                if (!product) {
                    return res.status(404).json({
                        message:
                            `Product ${cartProduct.product} not found`
                    });
                }


                // Check stock

                if (cartProduct.quantity > product.stock) {
                    return res.status(400).json({
                        message:
                            `Not enough stock for ${product.name}. Available stock: ${product.stock}`
                    });
                }


                const price = product.price;

                const quantity = cartProduct.quantity;


                totalPrice += price * quantity;


                orderProducts.push({

                    products: product._id,

                    quantity: quantity,

                    price: price

                });
            }


            // ==================== CREATE ORDER ====================

            const newOrder = await Order.create({

                user: req.currentUser.userId,

                products: orderProducts,

                totalPrice: totalPrice

            });


            // ==================== DECREASE STOCK ====================

            for (let i = 0; i < cart.products.length; i++) {

                const cartProduct = cart.products[i];

                await Product.findByIdAndUpdate(

                    cartProduct.product,

                    {
                        $inc: {
                            stock: -cartProduct.quantity
                        }
                    }
                );
            }


            // ==================== CLEAR CART ====================

            cart.products = [];

            cart.totalPrice = 0;

            await cart.save();


            // ==================== RESPONSE ====================

            return res.status(201).json({

                message:
                    'Order created successfully from cart',

                order: newOrder

            });


        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    }
);


module.exports = router;


