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

## Env

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/banking?schema=public"
REDIS_URL="redis://redis:6379"
JWT_SECRET="your_jwt_secret_key_change_this_in_production"
ADMIN_EMAIL="__________________________"
```
