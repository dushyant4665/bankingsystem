import { Router } from "express";
import { loginUser, signupUser } from "../controllers/authController";

const router = Router();

router.post("/signup", signupUser);
router.post("/register", signupUser);
router.post("/login", loginUser);

export default router;
