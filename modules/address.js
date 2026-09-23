const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        fullName: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        city: {
            type: String,
            required: true
        },

        area: {
            type: String,
            required: true
        },

        street: {
            type: String,
            required: true
        },

        building: {
            type: String,
            required: true
        },

        apartment: {
            type: String,
            default: ''
        },

        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Address', AddressSchema);