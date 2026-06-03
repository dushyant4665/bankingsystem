import { Router } from "express";
import { getCurrentUser } from "../controllers/userController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", requireAuth, getCurrentUser);

export default router;
