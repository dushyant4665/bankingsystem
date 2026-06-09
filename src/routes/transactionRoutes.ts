import { Router } from "express";
import { balance, deposit, history, transfer, withdraw } from "../controllers/transactionController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/balance", requireAuth, balance);
router.post("/deposit", requireAuth, deposit);
router.post("/withdraw", requireAuth, withdraw);
router.post("/transfer", requireAuth, transfer);
router.get("/history", requireAuth, history);

export default router;
