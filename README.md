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
## API Endpoints

The API is organized into multiple modules:

| Module     | Base Route   | Description                                          |
| ---------- | ------------ | ---------------------------------------------------- |
| Users      | `/users`     | Authentication and user management                   |
| Products   | `/products`  | Product management, search, filtering and pagination |
| Categories | `/category`  | Category management                                  |
| Cart       | `/cart`      | Shopping cart management                             |
| Orders     | `/order`     | Order creation and management                        |
| Reviews    | `/review`    | Product reviews and ratings                          |
| Wishlist   | `/wishlist`  | Wishlist management                                  |
| Addresses  | `/address`   | User address management                              |
| Coupons    | `/coupon`    | Coupon management                                    |
| Payments   | `/payment`   | Payment-related operations                           |
| Dashboard  | `/dashboard` | Admin dashboard and statistics                       |

### Authentication

The API uses **JWT Authentication**.

Protected endpoints require an access token in the request header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Some endpoints are restricted to administrators using role-based authorization.

### Main User Operations

```text
POST   /users/signup
POST   /users/signin
POST   /users/refresh
POST   /users/logout
POST   /users/forgot-password
POST   /users/reset-password/:token
PATCH  /users/updateuser/:id
DELETE /users/deleteuser/:id
```

### Main Product Operations

```text
GET    /products
GET    /products/:id
POST   /products/addproduct
PATCH  /products/:id
DELETE /products/:id
```

The products endpoint supports:

* Search by product name
* Price filtering
* Pagination
* Price sorting

Example:

```text
GET /products?search=phone&minPrice=100&maxPrice=1000&page=1&limit=10&sort=price_asc
```

### Orders

The Orders module provides:

* Create orders
* Retrieve orders
* Update orders
* Delete orders
* Update order status
* Stock management
* Automatic total price calculation

### Other Modules

The project also includes modules for:

* Shopping Cart
* Categories
* Reviews & Ratings
* Wishlist
* Addresses
* Coupons
* Payments
* Admin Dashboard

Swagger provides an interactive interface for testing and exploring the available API endpoints.

