import { Router } from "express";
import { UserController } from "../controllers/userController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", requireAuth, UserController.getProfile);
router.put("/me", requireAuth, UserController.updateProfile);

export default router;
