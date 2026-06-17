# ACID-Compliant Transactional Ledger API

A simple banking and ledger backend built with TypeScript, Express.js, Prisma ORM, PostgreSQL, JWT, bcrypt, and Redis.

## What this project does

- Signup and login with hashed passwords and JWT tokens
- Create one account per user
- Deposit, withdraw, and transfer money
- Protect money routes with JWT auth and role-based admin checks
- Use row-level locking inside database transactions to avoid double-spend
- Keep append-only transaction, audit, and ledger records
- Use Redis for auth rate limiting and admin dashboard caching
- Support Docker for PostgreSQL, Redis, and the app

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

## Core Idea

The main money-changing operations run inside `prisma.$transaction`.

This means:

- account balance updates happen together
- transaction rows are written together
- audit and ledger rows are written together
- if one step fails, the whole operation rolls back

The app also uses raw SQL row locking:

```sql
SELECT id FROM "Account" WHERE id = $1 FOR UPDATE
```

That stops two requests from spending the same money at the same time.

## Project Structure

```text
src/
  config/        Prisma and Redis setup
  controllers/   HTTP request handlers
  middleware/    Auth, admin guard, rate limit, error handling
  routes/        API route definitions
  services/      Business logic
  swagger.ts     Simple OpenAPI JSON
  index.ts       App entry point

prisma/
  schema.prisma  Database models
  migrations/    SQL migrations
```

## Database Models

- `User` stores login and profile data
- `Account` stores account number, balance, and freeze state
- `Transaction` stores deposit, withdraw, and transfer records
- `LedgerEntry` stores append-only ledger rows
- `AuditLog` stores admin and money-action audit logs

## Security

- Passwords are hashed with bcrypt
- JWT is required for protected routes
- Admin routes re-check role from database
- Frozen accounts cannot do money operations
- Redis rate limits auth endpoints

## Redis Usage

Redis is used for:

- auth rate limiting
- admin dashboard cache

If Redis is not running, the app still works. It just skips cache/rate-limit behavior.

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

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL and Redis with Docker

```bash
docker compose up -d postgres redis
```

### 3. Run Prisma migration

```bash
npx.cmd prisma migrate dev
```

### 4. Start the API

```bash
npm run dev
```

### 5. Check health

```http
GET http://localhost:3000/health
```

## Docker Full Run

Start everything together:

```bash
docker compose up --build
```

This starts:

- PostgreSQL container
- Redis container
- API container

## Prisma Commands

Generate client:

```bash
npx.cmd prisma generate
```

Create and apply a migration:

```bash
npx.cmd prisma migrate dev --name add_ledger_entries
```

Deploy existing migrations:

```bash
npx.cmd prisma migrate deploy
```

## Seeing Data in PostgreSQL

Open a shell inside the database container:

```bash
docker exec -it banking_db psql -U postgres -d banking
```

Useful SQL:

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
ADMIN_EMAIL="dushyantkhandelwal4665@gmail.com"
```

## Notes

- Money is stored as `Float` in this simple project
- Ledger entries are append-only from the app side
- Admin dashboard is cached in Redis for 30 seconds
- Auth routes are rate-limited through Redis

## Build

```bash
npm run build
```

## Start Compiled App

```bash
npm start
```
