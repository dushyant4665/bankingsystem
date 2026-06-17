export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Banking System API",
    version: "1.0.0",
  },
  paths: {
    "/health": { get: { summary: "Health check" } },
    "/api/auth/signup": { post: { summary: "Register a user" } },
    "/api/auth/login": { post: { summary: "Login user" } },
    "/api/users/me": { get: { summary: "Get profile" }, put: { summary: "Update profile" } },
    "/api/transactions/balance": { get: { summary: "Get account balance" } },
    "/api/transactions/deposit": { post: { summary: "Deposit money" } },
    "/api/transactions/withdraw": { post: { summary: "Withdraw money" } },
    "/api/transactions/transfer": { post: { summary: "Transfer money" } },
    "/api/transactions/history": { get: { summary: "Transaction history" } },
    "/api/transactions/ledger": { get: { summary: "Ledger entries" } },
    "/api/admin/dashboard": { get: { summary: "Admin dashboard summary" } },
    "/api/admin/users": { get: { summary: "List users" } },
    "/api/admin/audit-logs": { get: { summary: "Audit logs" } },
    "/api/admin/accounts/{accountNumber}/freeze": { patch: { summary: "Freeze account" } },
    "/api/admin/accounts/{accountNumber}/unfreeze": { patch: { summary: "Unfreeze account" } },
  },
};
