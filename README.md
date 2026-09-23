# E-Commerce API

A RESTful E-Commerce Backend API built with **Node.js, Express.js, and MongoDB**.

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
* Reviews & Ratings
* Address Management
* Coupons
* Payment Management
* Admin Dashboard
* Request Validation
* Swagger API Documentation

## Technologies

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
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

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=4000
MONGOOSEDB=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
RESET_PASSWORD_SECRET=your_reset_password_secret
```

Never commit the `.env` file or expose your secrets.

### 4. Run the Project

```bash
npm start
```

For development, if your project has the `dev` script:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:4000
```

## Swagger Documentation

```text
http://localhost:4000/api-docs
```

## API Endpoints

| Module     | Base Route    |
| ---------- | ------------- |
| Home       | `/`           |
| Users      | `/users`      |
| Products   | `/products`   |
| Orders     | `/order`      |
| Cart       | `/cart`       |
| Categories | `/categories` |
| Reviews    | `/reviews`    |
| Wishlist   | `/wishlist`   |
| Addresses  | `/addresses`  |
| Coupons    | `/coupons`    |
| Payments   | `/payments`   |
| Dashboard  | `/dashboard`  |

## Authentication

Protected endpoints require a JWT access token:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Some endpoints require administrator privileges.

## Project Structure

```text
E-Commerce/
├── bin/
├── middelware/
├── modules/
├── routes/
├── .gitignore
├── app.js
├── package.json
├── package-lock.json
└── README.md
```

## Author

**Sayed Mosbah**

GitHub: https://github.com/SayedMosb
