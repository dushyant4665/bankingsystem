export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Banking System API",
    version: "1.0.0",
  },
  paths: {
    "/health": { get: { summary: "Health check" } },
    "/api/auth/signup": { post: { summary: "Create user and account" } },
    "/api/auth/login": { post: { summary: "Login user" } },
    "/api/users/me": { get: { summary: "Get logged in user profile" } },
    "/api/transactions/balance": { get: { summary: "Get account balance" } },
    "/api/transactions/transfer": { post: { summary: "Transfer money with idempotency key" } },
    "/api/transactions/history": { get: { summary: "Get paginated transaction history" } },
    "/api/admin/dashboard": { get: { summary: "Admin dashboard summary" } },
    "/api/admin/users": { get: { summary: "Admin user list" } },
    "/api/admin/analytics": { get: { summary: "Transaction analytics" } },
    "/api/admin/audit-logs": { get: { summary: "Audit logs" } },
    "/api/admin/accounts/{accountNumber}/freeze": { patch: { summary: "Freeze account" } },
    "/api/admin/accounts/{accountNumber}/unfreeze": { patch: { summary: "Unfreeze account" } },
  },
};
