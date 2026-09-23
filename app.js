
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const productRouter = require('./routes/product');
const orderRouter = require('./routes/order');
const cartRouter = require('./routes/cart');
const categoryRouter = require('./routes/category');
const reviewRouter = require('./routes/review');
const wishlistRouter = require('./routes/wishlist');
const addressRouter = require('./routes/address');
const couponRouter = require('./routes/coupon');
const paymentRouter = require('./routes/payment');
const dashboardRouter = require('./routes/dashboard');

const cors = require('cors');
const mongoose = require('mongoose');

var app = express();


const swaggerOptions = {
    definition: {
        openapi: '3.0.0',

        info: {
            title: 'E-Commerce API',
            version: '1.0.0',
            description: 'E-Commerce Backend API'
        },

      servers: [
    {
        url: process.env.API_URL || 'http://localhost:4000'
    }
],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },


    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true
}));


app.use(logger('dev'));

app.use(express.json());

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(cors());



app.use('/', indexRouter);

app.use('/users', usersRouter);

app.use('/products', productRouter);

app.use('/order', orderRouter);

app.use('/cart', cartRouter);

app.use('/categories', categoryRouter);

app.use('/reviews', reviewRouter);

app.use('/wishlist', wishlistRouter);

app.use('/addresses', addressRouter);

app.use('/coupons', couponRouter);

app.use('/payments', paymentRouter);

app.use('/dashboard', dashboardRouter);



app.use(function (req, res, next) {
    next(createError(404));
});




app.use(function (err, req, res, next) {
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message
    });
});



mongoose.connect(process.env.MONGOOSEDB)
    .then(() => console.log('connected to DB'))
    .catch(err => console.log(err.message));


module.exports = app;
