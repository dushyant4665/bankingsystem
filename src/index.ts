import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import userRoutes from "./routes/userRoutes";
import { swaggerSpec } from "./swagger";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Banking System API",
    routes: {
      health: "GET /health",
      docs: "GET /swagger.json",
      signup: "POST /api/auth/signup",
      login: "POST /api/auth/login",
      profile: "GET /api/users/me",
      balance: "GET /api/transactions/balance",
      deposit: "POST /api/transactions/deposit",
      withdraw: "POST /api/transactions/withdraw",
      transfer: "POST /api/transactions/transfer",
      history: "GET /api/transactions/history",
      adminDashboard: "GET /api/admin/dashboard",
    },
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ success: true, message: "Server is running" });
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
