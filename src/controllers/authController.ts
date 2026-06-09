import { Request, Response } from "express";
import { signup, login } from "../services/authService";
import { handleError } from "../middleware/errorHandler";

export const signupUser = async (req: Request, res: Response) => {
  try {
    res.status(201).json({ success: true, ...(await signup(req.body)) });
  } catch (e) {
    handleError(e, res);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, ...(await login(req.body)) });
  } catch (e) {
    handleError(e, res);
  }
};
