import { Router } from "express";
import { balance, history, transfer } from "../controllers/transactionController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/balance", requireAuth, balance);
router.get("/history", requireAuth, history);
router.post("/transfer", requireAuth, transfer);

export default router;
