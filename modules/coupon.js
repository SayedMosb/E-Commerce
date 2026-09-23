const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        discountPercentage: {
            type: Number,
            required: true,
            min: 1,
            max: 100
        },

        expiresAt: {
            type: Date,
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Coupon', CouponSchema);