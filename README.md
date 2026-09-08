# Cafe Management Backend

Backend API for a complete cafe management system built with **NestJS**, **PostgreSQL**, and **TypeORM**.

## Overview

This project is a modular REST API designed for real cafe operations, including authentication, user management, menu, tables, orders, and payments.

The main focus is on clean architecture, business logic correctness, and safe concurrent operations.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT + Passport
- Swagger
- class-validator / class-transformer
- bcrypt

## Features

### Auth
- User registration and login
- JWT Access Token
- Refresh Token with rotation
- Token support from both Authorization header and HTTP-only cookies
- Role-based access control

### Users
- Profile management
- Admin user management
- Block / unblock users
- Role updates
- Search and pagination

### Menu
- Category management
- Product management
- Image upload
- Soft delete
- Stock and availability fields

### Tables
- Table CRUD
- Table status management
- Available tables listing

### Orders
- Create dine-in orders
- Add / update / remove order items
- Order status workflow
- Stock decrease and restore
- Conditional table release
- Transactions and pessimistic locking

### Payments
- Manual payment recording (cash / card)
- Partial payments support
- Payment summary (paid / remaining)
- Refund handling

## Project Structure

    src/
    ├── auth/
    ├── users/
    ├── menu/
    ├── table/
    ├── orders/
    ├── payments/
    └── common/

## Getting Started

### 1. Install dependencies

    npm install

### 2. Environment variables

Create a `.env` file in the root directory:

    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=postgres
    DB_DATABASE=coffe
    JWT_SECRET=your_access_secret
    JWT_REFRESH_SECRET=your_refresh_secret
    PORT=3000
    NODE_ENV=development

### 3. Run the project

    npm run start:dev

### 4. Swagger documentation

    http://localhost:3000/api-docs

## Main API Modules

| Module | Description |
|--------|-------------|
| Auth | Signup, signin, refresh, logout |
| Users | User profile and admin management |
| Menu | Categories and products |
| Tables | Cafe table management |
| Orders | Order lifecycle and items |
| Payments | Payment tracking and summary |

## Security Highlights

- Passwords hashed with bcrypt
- Refresh tokens stored hashed in database
- Short-lived access tokens
- Refresh token rotation
- Role guards for protected routes
- Input validation with DTOs

## Author

**Mohammad Habibi**  
Backend Developer
