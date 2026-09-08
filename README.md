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

```text
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

```bash
npm install



npm run start:dev


http://localhost:3000/api-docs


Security Highlights

Passwords hashed with bcrypt
Refresh tokens stored hashed in database
Short-lived access tokens
Refresh token rotation
Role guards for protected routes
Input validation with DTOs

Author
Mohammad Habibi
