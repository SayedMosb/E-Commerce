# E-Commerce API

A RESTful E-Commerce Backend API built with **Node.js, Express.js, and MongoDB**.

The project provides the core backend functionality for an online store, including user authentication, products, categories, shopping cart, orders, reviews, wishlist, coupons, addresses, payments, and dashboard management.

## Features

* User Registration & Login
* JWT Authentication
* Access & Refresh Tokens
* Logout
* Forgot Password & Reset Password
* Role-Based Authorization
* Product Management
* Product Search, Filtering, Sorting & Pagination
* Category Management
* Shopping Cart
* Wishlist
* Orders Management
* Order Status Management
* Reviews & Ratings
* Address Management
* Coupons
* Payment Management
* Admin Dashboard
* Request Validation
* Swagger API Documentation
* MongoDB Database with Mongoose

## Technologies

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token (JWT)
* bcrypt
* express-validator
* Swagger
* Multer
* CORS
  ## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SayedMosb/E-Commerce.git
cd E-Commerce
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory of the project:

```env
PORT=4000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET_KEY=your_jwt_secret_key
RESET_PASSWORD_SECRET=your_reset_password_secret
```

Replace the example values with your own configuration.

> **Important:** Never commit your `.env` file or expose your database credentials and secret keys publicly.

### 4. Run the Project

For development:

```bash
npm run dev
```

Or:

```bash
npm start
```

The API will run on:

```text
http://localhost:4000
```

### 5. Swagger Documentation

After starting the server, open the Swagger documentation:

```text
http://localhost:4000/api-docs
```

Swagger provides an interactive interface for testing and exploring the available API endpoints.

