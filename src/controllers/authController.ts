import { Request, Response } from "express";
import { ZodError } from "zod";
import { loginUser, registerUser } from "../services/authService";

export async function register(req: Request, res: Response) {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleAuthError(error, res);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error) {
    handleAuthError(error, res);
  }
}

function handleAuthError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      issues: error.issues,
    });
    return;
  }

  if (error instanceof Error) {
    const status = error.message.includes("Invalid") ? 401 : 400;
    res.status(status).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "Internal server error" });
}
