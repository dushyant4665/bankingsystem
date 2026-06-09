export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Banking System API",
    version: "1.0.0",
  },
  paths: {
    "/health": { get: { summary: "Check server health" } },
    "/api/auth/signup": { post: { summary: "Create user and account" } },
    "/api/auth/login": { post: { summary: "Login and get token" } },
    "/api/users/me": { get: { summary: "Get logged in user" } },
    "/api/transactions/balance": { get: { summary: "Get balance" } },
    "/api/transactions/deposit": { post: { summary: "Deposit money" } },
    "/api/transactions/withdraw": { post: { summary: "Withdraw money" } },
    "/api/transactions/transfer": { post: { summary: "Transfer money" } },
    "/api/transactions/history": { get: { summary: "Get transactions" } },
    "/api/admin/dashboard": { get: { summary: "Admin summary" } },
    "/api/admin/users": { get: { summary: "All users" } },
    "/api/admin/audit-logs": { get: { summary: "Audit logs" } },
    "/api/admin/accounts/{accountNumber}/freeze": { patch: { summary: "Freeze account" } },
    "/api/admin/accounts/{accountNumber}/unfreeze": { patch: { summary: "Unfreeze account" } },
  },
};
