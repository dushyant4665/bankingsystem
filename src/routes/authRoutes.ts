import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { createRateLimit } from "../middleware/rateLimit";

const router = Router();
const authLimit = createRateLimit({
  windowSeconds: 60,
  maxRequests: 10,
  message: "Too many auth requests, please try again after a minute",
});

router.post("/signup", authLimit, AuthController.signup);
router.post("/register", authLimit, AuthController.signup);
router.post("/login", authLimit, AuthController.login);

export default router;
