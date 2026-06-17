# Technical Requirements Specification: Banking System API

## 1. Purpose

This document explains the technical design, stack, architecture, data model, API behavior, security model, and implementation rules for the Banking System API.

## 2. Technology Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| Language | TypeScript |
| HTTP Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| PostgreSQL Adapter | `@prisma/adapter-pg` with `pg` Pool |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Input Validation | Zod |
| API Docs | OpenAPI JSON |

## 3. Runtime Configuration

Required environment variables:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/banking?schema=public"
JWT_SECRET="change-this-secret"
PORT=3000
NODE_ENV="development"
ADMIN_EMAIL="admin@example.com"
```

### Environment Variable Use

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: secret used to sign and verify JWT tokens.
- `PORT`: HTTP server port.
- `ADMIN_EMAIL`: signup email that receives `ADMIN` role.

## 4. System Architecture

```mermaid
flowchart LR
    HTTP[HTTP Request] --> Route[Route]
    Route --> Middleware[Auth/Admin Middleware]
    Middleware --> Controller[Controller]
    Controller --> Service[Service]
    Service --> Prisma[Prisma Client]
    Prisma --> DB[(PostgreSQL)]
```

## 5. Code Architecture

```text
src/
  config/database.ts          Prisma client and PostgreSQL pool
  controllers/                HTTP request and response handling
  middleware/                 Auth, admin, and error helpers
  routes/                     Express route definitions
  services/                   Business logic and database operations
  swagger.ts                  OpenAPI JSON object
  index.ts                    Application bootstrap
```

### Route Layer

Responsibilities:

- Define HTTP method and path.
- Attach middleware.
- Forward request to controller.

Route files:

- `authRoutes.ts`
- `userRoutes.ts`
- `transactionRoutes.ts`
- `adminRoutes.ts`

### Controller Layer

Responsibilities:

- Read request body, params, and query.
- Call service functions.
- Send HTTP response.
- Delegate errors to `handleError`.

### Service Layer

Responsibilities:

- Validate input using Zod.
- Apply business rules.
- Run Prisma queries.
- Use Prisma transactions for balance-changing operations.
- Create audit logs.

### Middleware Layer

Responsibilities:

- `requireAuth`: validates JWT token and loads user from database.
- `requireAdmin`: runs `requireAuth` and checks `role === "ADMIN"`.
- `handleError`: formats Zod and Error responses.

## 6. Database Design

```mermaid
erDiagram
    User ||--o| Account : owns
    Account ||--o{ Transaction : sends
    Account ||--o{ Transaction : receives
    AuditLog {
      string id
      string userId
      string action
      string details
      datetime createdAt
    }
```

### User

Stores authentication and profile data.

Fields:

- `id`
- `name`
- `email`
- `phone`
- `passwordHash`
- `role`
- `account`
- `createdAt`
- `updatedAt`

Rules:

- `email` must be unique.
- `passwordHash` stores bcrypt hash, never plain password.
- `role` is `CUSTOMER` by default.

### Account

Stores bank account information.

Fields:

- `id`
- `accountNumber`
- `accountType`
- `balance`
- `isFrozen`
- `userId`
- `createdAt`
- `updatedAt`

Rules:

- One user has one account.
- `accountNumber` must be unique.
- Frozen accounts cannot deposit, withdraw, or transfer.

### Transaction

Stores deposit, withdraw, and transfer records.

Fields:

- `id`
- `amount`
- `type`
- `note`
- `fromAccountId`
- `toAccountId`
- `createdAt`

Rules:

- Deposit creates `CREDIT` transaction with `toAccountId`.
- Withdraw creates `DEBIT` transaction with `fromAccountId`.
- Transfer creates `DEBIT` transaction with both account IDs.

### AuditLog

Stores important system events.

Fields:

- `id`
- `userId`
- `action`
- `details`
- `createdAt`

Logged actions:

- `DEPOSIT`
- `WITHDRAW`
- `TRANSFER`
- `ACCOUNT_FROZEN`
- `ACCOUNT_UNFROZEN`

## 7. API Requirements

### Health

`GET /health`

Returns:

- `success`
- `message`

### Signup

`POST /api/auth/signup`

Body:

```json
{
  "name": "Dushyant",
  "email": "dushyant@example.com",
  "password": "1231231421",
  "phone": "9530253134"
}
```

Behavior:

- Validates name, email, password, phone.
- Blocks duplicate email.
- Hashes password.
- Creates user.
- Creates account with starting balance.
- Returns user and token.

### Login

`POST /api/auth/login`

Behavior:

- Validates email and password.
- Verifies password with bcrypt.
- Returns user and token.

### Profile

`GET /api/users/me`

Requires:

- Bearer token.

Returns:

- user profile
- linked account

### Balance

`GET /api/transactions/balance`

Requires:

- Bearer token.

Returns:

- account data
- current balance

### Deposit

`POST /api/transactions/deposit`

Body:

```json
{
  "amount": 500,
  "note": "Cash deposit"
}
```

Rules:

- amount must be positive.
- account must not be frozen.
- update and transaction record must happen inside one Prisma transaction.

### Withdraw

`POST /api/transactions/withdraw`

Rules:

- amount must be positive.
- account must not be frozen.
- balance must be sufficient.
- update and transaction record must happen inside one Prisma transaction.

### Transfer

`POST /api/transactions/transfer`

Body:

```json
{
  "toAccountNumber": "ACC123456",
  "amount": 100,
  "note": "Payment"
}
```

Rules:

- sender account must exist.
- receiver account must exist.
- sender and receiver must be different.
- both accounts must not be frozen.
- sender balance must be sufficient.
- sender debit, receiver credit, transaction record, and audit log run inside one Prisma transaction.

### History

`GET /api/transactions/history`

Returns:

- all transactions involving current user's account, latest first.

### Admin Dashboard

`GET /api/admin/dashboard`

Requires:

- admin token.

Returns:

- total users
- total accounts
- total transactions
- total balance

### Admin Users

`GET /api/admin/users`

Requires:

- admin token.

Returns:

- users with account data.

### Audit Logs

`GET /api/admin/audit-logs`

Requires:

- admin token.

Returns:

- latest audit logs, limited to 100.

### Freeze Account

`PATCH /api/admin/accounts/:accountNumber/freeze`

Requires:

- admin token.

Behavior:

- sets `isFrozen` to `true`.
- creates audit log.

### Unfreeze Account

`PATCH /api/admin/accounts/:accountNumber/unfreeze`

Requires:

- admin token.

Behavior:

- sets `isFrozen` to `false`.
- creates audit log.

## 8. Security Requirements

- Passwords must be hashed with bcrypt before storage.
- JWT token must be required for protected routes.
- Admin routes must verify current database role, not only token claims.
- Invalid tokens must return `401`.
- Non-admin access to admin routes must return `403`.
- Frozen accounts must be blocked from money operations.
- Request body validation must use Zod.

## 9. ACID and Consistency

Money-changing operations must use `prisma.$transaction`:

- deposit
- withdraw
- transfer

This keeps account balance updates, transaction records, and audit logs consistent.

## 10. Connection Pooling

Database access uses `pg` Pool:

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
```

This allows the API to reuse database connections instead of opening a new database connection for every request.

## 11. Error Handling

Error responses follow this shape:

```json
{
  "success": false,
  "message": "Error message"
}
```

Validation errors include Zod issues:

```json
{
  "success": false,
  "message": "Invalid input",
  "errors": []
}
```

## 12. Current Technical Limitations

- Transaction history is not paginated in the current implementation.
- Transfer idempotency is not implemented in the current schema.
- Admin analytics are limited to dashboard summary counts.
- Swagger spec is a lightweight JSON object, not a full Swagger UI page.
- No automated unit or integration tests are present.

## 13. Build and Run

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Build:

```bash
npm run build
```

Start compiled server:

```bash
npm start
```