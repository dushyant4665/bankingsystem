import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import userRoutes from "./routes/userRoutes";
import { swaggerSpec } from "./swagger";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Banking System API",
    status: "healthy",
    endpoints: {
      signup: "POST /api/auth/signup",
      login: "POST /api/auth/login",
      me: "GET /api/users/me",
      balance: "GET /api/transactions/balance",
      deposit: "POST /api/transactions/deposit",
      withdraw: "POST /api/transactions/withdraw",
      transfer: "POST /api/transactions/transfer",
      history: "GET /api/transactions/history",
      ledger: "GET /api/transactions/ledger",
      admin: "GET /api/admin/dashboard",
      swagger: "GET /swagger.json",
    },
  });
});

app.get("/swagger.json", (_req: Request, res: Response) => {
  res.json(swaggerSpec);
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
