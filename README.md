# Banking System API

Simple banking backend made with Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt, and Zod.

## Features

- Signup and login
- JWT authentication
- User profile
- Account balance
- Deposit money
- Withdraw money
- Transfer money
- Transaction history
- Admin dashboard
- Admin user list
- Freeze and unfreeze accounts
- Audit logs

## Setup

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/banking?schema=public"
JWT_SECRET="change-this-secret"
PORT=3000
NODE_ENV="development"
ADMIN_EMAIL="admin@example.com"
```

Install and run:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Build:

```bash
npm run build
npm start
```

## API

Public routes:

```text
GET  /
GET  /health
GET  /swagger.json
POST /api/auth/signup
POST /api/auth/login
```

User routes need this header:

```text
Authorization: Bearer YOUR_TOKEN
```

```text
GET  /api/users/me
GET  /api/transactions/balance
POST /api/transactions/deposit
POST /api/transactions/withdraw
POST /api/transactions/transfer
GET  /api/transactions/history
```

Admin routes:

```text
GET   /api/admin/dashboard
GET   /api/admin/users
GET   /api/admin/audit-logs
PATCH /api/admin/accounts/:accountNumber/freeze
PATCH /api/admin/accounts/:accountNumber/unfreeze
```

## Example Bodies

Signup:

```json
{
  "name": "Dushyant",
  "email": "dushyant@example.com",
  "password": "123456",
  "phone": "9530253134"
}
```

Login:

```json
{
  "email": "dushyant@example.com",
  "password": "123456"
}
```

Deposit or withdraw:

```json
{
  "amount": 500,
  "note": "Cash"
}
```

Transfer:

```json
{
  "toAccountNumber": "ACC123456789",
  "amount": 100,
  "note": "Payment"
}
```
