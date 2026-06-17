import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { AuthService } from "../services/authService";

const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  phone: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const input = signupSchema.parse(req.body);
      const data = await AuthService.signup(input);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const input = loginSchema.parse(req.body);
      const data = await AuthService.login(input);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}
