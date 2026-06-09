import { Router } from "express";
import { auditLogs, dashboard, freezeAccount, unfreezeAccount, users } from "../controllers/adminController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/dashboard", requireAdmin, dashboard);
router.get("/users", requireAdmin, users);
router.get("/audit-logs", requireAdmin, auditLogs);
router.patch("/accounts/:accountNumber/freeze", requireAdmin, freezeAccount);
router.patch("/accounts/:accountNumber/unfreeze", requireAdmin, unfreezeAccount);

export default router;
