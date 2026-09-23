const express = require('express');

const router = express.Router();

const {
    body,
    param,
    validationResult
} = require('express-validator');

const Address = require('../modules/address');

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


// ==================== GET ADDRESSES ====================

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Get all addresses of the current user
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *       401:
 *         description: Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get(
    '/',
    verifyToken,

    async (req, res) => {

        try {

            const addresses = await Address.find({
                user: req.currentUser.userId
            });

            return res.status(200).json({
                addresses
            });

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    }
);


// ==================== ADD ADDRESS ====================

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Add a new address
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *               - city
 *               - area
 *               - street
 *               - building
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Sayed Mosbah
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               city:
 *                 type: string
 *                 example: Alexandria
 *               area:
 *                 type: string
 *                 example: Smouha
 *               street:
 *                 type: string
 *                 example: El Nozha Street
 *               building:
 *                 type: string
 *                 example: 15
 *               apartment:
 *                 type: string
 *                 example: 8
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Address added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    verifyToken,

    body('fullName')
        .notEmpty(),

    body('phone')
        .notEmpty(),

    body('city')
        .notEmpty(),

    body('area')
        .notEmpty(),

    body('street')
        .notEmpty(),

    body('building')
        .notEmpty(),

    checkValidation,

    async (req, res) => {

        try {

            if (req.body.isDefault === true) {

                await Address.updateMany(
                    {
                        user: req.currentUser.userId
                    },
                    {
                        isDefault: false
                    }
                );
            }


            const address = await Address.create({

                ...req.body,

                user: req.currentUser.userId

            });


            return res.status(201).json({

                message: 'Address added successfully',

                address

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });
        }
    }
);


// ==================== UPDATE ADDRESS ====================

/**
 * @swagger
 * /addresses/{id}:
 *   patch:
 *     summary: Update an address
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Sayed Mosbah
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               city:
 *                 type: string
 *                 example: Alexandria
 *               area:
 *                 type: string
 *                 example: Smouha
 *               street:
 *                 type: string
 *                 example: El Nozha Street
 *               building:
 *                 type: string
 *                 example: 20
 *               apartment:
 *                 type: string
 *                 example: 10
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Invalid address ID
 *       401:
 *         description: Invalid or missing token
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id',

    verifyToken,

    param('id')
        .isMongoId(),

    checkValidation,

    async (req, res) => {

        try {

            const address = await Address.findOne({

                _id: req.params.id,

                user: req.currentUser.userId

            });


            if (!address) {

                return res.status(404).json({

                    message: 'Address not found'

                });
            }


            if (req.body.isDefault === true) {

                await Address.updateMany(

                    {
                        user: req.currentUser.userId
                    },

                    {
                        isDefault: false
                    }

                );
            }


            Object.assign(address, req.body);

            await address.save();


            return res.status(200).json({

                message: 'Address updated successfully',

                address

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });
        }
    }
);


// ==================== DELETE ADDRESS ====================

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       400:
 *         description: Invalid address ID
 *       401:
 *         description: Invalid or missing token
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',

    verifyToken,

    param('id')
        .isMongoId(),

    checkValidation,

    async (req, res) => {

        try {

            const address = await Address.findOneAndDelete({

                _id: req.params.id,

                user: req.currentUser.userId

            });


            if (!address) {

                return res.status(404).json({

                    message: 'Address not found'

                });
            }


            return res.status(200).json({

                message: 'Address deleted successfully'

            });

        } catch (err) {

            return res.status(500).json({

                message: err.message

            });
        }
    }
);


module.exports = router;
