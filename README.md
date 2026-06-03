# Banking System API

A TypeScript REST API for basic banking operations. It handles user signup, login, account balance, money transfer, transaction history, admin controls, audit logs, and analytics.

## Tech Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- JWT
- bcrypt
- Zod

## Architecture

```mermaid
flowchart TD
    A[Client / Postman] --> B[Express Server]
    B --> C[Routes]
    C --> D[Auth Middleware]
    D --> E[Controllers]
    E --> F[Services]
    F --> G[Prisma ORM]
    G --> H[(PostgreSQL)]

    F --> I[Audit Logs]
    F --> J[Anomaly Rules]
    F --> K[ACID Transaction]
```

## Features

- User signup and login
- JWT based authentication
- Automatic account creation on signup
- Balance check
- Money transfer
- Transaction history with pagination
- Idempotent transfer using `idempotencyKey`
- Rule based anomaly detection for large transfers
- ACID safe balance update using Prisma transaction
- Admin dashboard APIs
- Account freeze and unfreeze
- Audit logs
- Transaction analytics
- Swagger JSON at `/swagger.json`

## Project Structure

```text
src/
  config/          Prisma database connection
  controllers/     Request handlers
  middleware/      Auth and admin checks
  routes/          API routes
  services/        Business logic
  index.ts         App entry point

prisma/
  schema.prisma    Database schema
  migrations/      Migration files
```

## Environment Variables

Create `.env` in the root folder:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/banking?schema=public"
JWT_SECRET="change-this-secret"
PORT=3000
NODE_ENV="development"
ADMIN_EMAIL="admin@example.com"
```

The user who signs up with `ADMIN_EMAIL` becomes an admin.

## Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Build and run compiled code:

```bash
npm run build
npm start
```

## API Summary

| Method | Endpoint | Use |
| --- | --- | --- |
| GET | `/health` | Server health check |
| POST | `/api/auth/signup` | Create user and account |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/users/me` | Get logged-in user profile |
| GET | `/api/transactions/balance` | Get account balance |
| POST | `/api/transactions/transfer` | Transfer money |
| GET | `/api/transactions/history?page=1&limit=10` | Paginated transaction history |
| GET | `/api/admin/dashboard` | Admin dashboard data |
| GET | `/api/admin/users` | Admin user list |
| GET | `/api/admin/analytics` | Transaction analytics |
| GET | `/api/admin/audit-logs?page=1&limit=20` | Audit logs |
| PATCH | `/api/admin/accounts/:accountNumber/freeze` | Freeze account |
| PATCH | `/api/admin/accounts/:accountNumber/unfreeze` | Unfreeze account |
| GET | `/swagger.json` | OpenAPI JSON |

## Example Signup

```json
{
  "name": "Dushyant",
  "email": "dushyant@example.com",
  "password": "1231231421",
  "phone": "9530253134"
}
```

## Example Transfer

Use JWT token in headers:

```text
Authorization: Bearer YOUR_TOKEN
```

Body:

```json
{
  "toAccountNumber": "ACC123456789",
  "amount": 100,
  "note": "Payment",
  "idempotencyKey": "transfer-key-001"
}
```

## Database Tables

- `User`
- `Account`
- `Transaction`
- `AuditLog`

In pgAdmin:

```text
Databases > banking > Schemas > public > Tables
```
