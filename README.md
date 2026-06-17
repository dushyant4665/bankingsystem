# ACID-Compliant Transactional Ledger API

Simple banking API built with TypeScript, Express.js, Prisma, PostgreSQL, JWT, bcrypt, Redis, and Docker.

## What it does

- signup and login
- create one account per user
- deposit, withdraw, transfer
- view balance, history, and ledger
- admin can freeze and unfreeze accounts
- audit logs for important actions

## Simple flow

```mermaid
flowchart TD
  Client[Client / Postman] --> API[Express API]
  API --> Auth[JWT Auth]
  API --> Ctrl[Controller]
  Ctrl --> Svc[Service]
  Svc --> Tx[Prisma Transaction]
  Tx --> PG[(PostgreSQL)]
  Svc --> Redis[(Redis)]
```

## Main idea

- money changes run inside `prisma.$transaction`
- account rows are locked with `SELECT ... FOR UPDATE`
- that stops two requests from using the same balance at the same time
- ledger and audit rows are written after money updates

## Tech stack

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- Redis
- Docker

## API

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

## Run locally

1. Install deps

```bash
npm install
```

2. Start DB and Redis

```bash
docker compose up -d postgres redis
```

3. Run Prisma migration

```bash
npx.cmd prisma migrate dev
```

4. Start app

```bash
npm run dev
```

## Run with Docker

```bash
docker compose up --build
```

## Prisma commands

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

## See DB data

Open psql:

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

## Env

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/banking?schema=public"
REDIS_URL="redis://redis:6379"
JWT_SECRET="your_jwt_secret_key_change_this_in_production"
ADMIN_EMAIL="dushyantkhandelwal4665@gmail.com"
```

## Notes

- money is stored as `Float` in this simple project
- Redis is used for auth rate limiting and dashboard cache
- if Redis is off, the app still works

