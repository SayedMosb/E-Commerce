const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    products: [
        {
            products: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },

            quantity: {
                type: Number,
                required: true,
                min: 1
            },

            // Price of the product at the time of purchase
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],

    // Total price of the whole order
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled'
        ],
        default: 'pending'
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
