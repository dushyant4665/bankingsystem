# ACID-Compliant Transactional Ledger API

A simple backend banking API built with TypeScript, Express.js, Prisma ORM, PostgreSQL, JWT, bcrypt, Redis, and Docker.

This project focuses on safe money movement, protected routes, and clean code that is easy to explain in interviews.

## What It Does

- signup and login with hashed passwords
- create one bank account per user
- deposit, withdraw, and transfer money
- keep a ledger for balance changes
- protect sensitive routes with JWT
- let admins freeze and unfreeze accounts
- store audit logs for important actions

## Main Idea

The money flow is built to stay consistent under concurrent requests.

- balance-changing actions run inside database transactions
- account rows are locked with `SELECT ... FOR UPDATE`
- transfers lock accounts in a fixed order to reduce deadlocks
- serializable isolation is used with retry logic
- idempotency handling helps avoid duplicate writes on repeated requests
- ledger and audit rows are written in the same transaction as the balance update

## Mermaid Architecture

```mermaid
flowchart TD
  Client[Client / Postman] --> API[Express API]
  API --> JWT[JWT Middleware]
  JWT --> Ctrl[Controller]
  Ctrl --> Svc[Service Layer]
  Svc --> Tx[Serializable DB Transaction]
  Tx --> Lock[Row Lock: SELECT ... FOR UPDATE]
  Lock --> PG[(PostgreSQL)]
  Svc --> Ledger[Ledger Entry]
  Svc --> Audit[Audit Log]
  Svc --> Redis[(Redis Cache / Rate Limit)]
```

## Request Flow

### Authentication

1. User signs up or logs in.
2. Password is hashed with `bcrypt`.
3. Server creates a stateless JWT.
4. Protected routes read the bearer token.
5. Token is verified and the user is loaded from the database.

### Money Transfer

1. User sends amount and account details.
2. Server starts a serializable transaction.
3. From and to accounts are locked.
4. Fresh balances are re-read.
5. Balance is updated safely.
6. Transaction, ledger entry, and audit log are written together.

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- Redis
- Docker

## API Endpoints

### Public

- `GET /`
- `GET /health`
- `GET /swagger.json`

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/register`
- `POST /api/auth/login`

### User

- `GET /api/users/me`
- `PUT /api/users/me`

### Transactions

- `GET /api/transactions/balance`
- `POST /api/transactions/deposit`
- `POST /api/transactions/withdraw`
- `POST /api/transactions/transfer`
- `GET /api/transactions/history`
- `GET /api/transactions/ledger`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/audit-logs`
- `PATCH /api/admin/accounts/:accountNumber/freeze`
- `PATCH /api/admin/accounts/:accountNumber/unfreeze`

## Running Locally

1. Install dependencies

```bash
npm install
```

2. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

3. Run Prisma migrations

```bash
npx.cmd prisma migrate dev
```

4. Start the app

```bash
npm run dev
```

## Docker Run

```bash
docker compose up --build
```

## Prisma Commands

Generate client:

```bash
npx.cmd prisma generate
```

Create migration:

```bash
npx.cmd prisma migrate dev --name add_ledger_entries
```

Deploy migrations:

```bash
npx.cmd prisma migrate deploy
```

## Database Check

Open `psql`:

```bash
docker exec -it banking_db psql -U postgres -d banking
```

Useful queries:

```sql
\dt
SELECT * FROM "User";
SELECT * FROM "Account";
SELECT * FROM "Transaction";
SELECT * FROM "LedgerEntry";
SELECT * FROM "AuditLog";
```

Exit:

```sql
\q
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/banking?schema=public"
REDIS_URL="redis://redis:6379"
JWT_SECRET="your_jwt_secret_key_change_this_in_production"
ADMIN_EMAIL="__________________________"
```

## Interview-Friendly Summary

- JWT is used for stateless authentication.
- Protected routes check the token and then load the user from the database.
- Money operations use database transactions so balance updates stay atomic.
- `SELECT ... FOR UPDATE` blocks two requests from editing the same account row at the same time.
- Transfer requests lock accounts in a stable order to reduce deadlocks.
- Ledger rows and audit rows are written with the balance change so the system stays traceable.

## Notes

- Money is still stored as `Float` in this version, so if you want production-grade precision, switch to integer cents or `Decimal`.
- Redis is used for auth rate limiting and dashboard cache.
- If Redis is off, the app still works.
