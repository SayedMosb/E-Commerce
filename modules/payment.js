const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            unique: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        method: {
            type: String,
            enum: [
                'cash',
                'card',
                'wallet'
            ],
            required: true
        },

        status: {
            type: String,
            enum: [
                'pending',
                'paid',
                'failed'
            ],
            default: 'pending'
        },

        transactionId: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Payment', PaymentSchema);