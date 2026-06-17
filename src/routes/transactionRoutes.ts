import { Router } from "express";
import { TransactionController } from "../controllers/transactionController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/balance", requireAuth, TransactionController.balance);
router.post("/deposit", requireAuth, TransactionController.deposit);
router.post("/withdraw", requireAuth, TransactionController.withdraw);
router.post("/transfer", requireAuth, TransactionController.transfer);
router.get("/history", requireAuth, TransactionController.history);
router.get("/ledger", requireAuth, TransactionController.ledger);

export default router;
