# E-Commerce API

A production-ready RESTful E-Commerce Backend API built with **Node.js, Express.js, and MongoDB**.

The project provides a complete backend solution for an e-commerce platform, including authentication, product management, shopping cart, orders, reviews, wishlist, coupons, payments, and admin dashboard functionality.

## 🚀 Live Demo

**Base API URL:**
https://e-commerce-api-one-pi.vercel.app

**Swagger API Documentation:**
https://e-commerce-api-one-pi.vercel.app/api-docs

---

## ✨ Features

### Authentication & Authorization

* User Registration & Login
* JWT Authentication
* Access & Refresh Tokens
* Logout
* Forgot Password & Reset Password
* Password Hashing
* Role-Based Authorization
* Protected Routes

### Products

* Create, Read, Update & Delete Products
* Product Search
* Filtering
* Sorting
* Pagination
* Product Image Upload

### E-Commerce

* Category Management
* Shopping Cart
* Wishlist
* Orders Management
* Reviews & Ratings
* Address Management
* Coupon Management
* Payment Management

### Admin

* Role-Based Access Control
* Admin Dashboard
* Protected Admin Routes

### API & Security

* Request Validation
* Centralized Error Handling
* CORS
* JWT Security
* Swagger API Documentation

---

## 🛠️ Technologies

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**
* **JWT**
* **bcrypt**
* **express-validator**
* **Swagger / OpenAPI**
* **Multer**
* **CORS**

---

## 📁 Project Structure

```text
E-Commerce/
│
├── middleware/
├── modules/
├── routes/
├── public/
├── app.js
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation & Setup

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

Create a `.env` file in the root directory:

```env
PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret
JWT_REFRESH_SECRET_KEY=your_refresh_token_secret
API_URL=http://localhost:4000
```

> Never commit your `.env` file or expose your secret keys.

### 4. Run the Project

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

---

## 📚 API Documentation

The API is documented using **Swagger / OpenAPI**.

You can explore and test all available endpoints through:

https://e-commerce-api-one-pi.vercel.app/api-docs

---

## 🔐 Authentication

The API uses **JWT-based authentication**.

Protected endpoints require an access token:

```http
Authorization: Bearer <access_token>
```

The project also supports refresh tokens for maintaining authenticated sessions.

---

## 🔎 API Capabilities

The API supports common backend features such as:

* CRUD Operations
* Authentication & Authorization
* Pagination
* Filtering
* Sorting
* Searching
* Validation
* File Uploads
* Error Handling
* Protected Routes
* Role-Based Access Control

---

## ☁️ Deployment

The backend is deployed using **Vercel** and connected to **MongoDB**.

**Production API:**

https://e-commerce-api-one-pi.vercel.app

---

## 👨‍💻 Author

**Sayed Mosbah**

Backend Developer | Node.js | Express.js | MongoDB

GitHub:
https://github.com/SayedMosb
