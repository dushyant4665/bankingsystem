import { Response } from "express";
import { ZodError } from "zod";

export const handleError = (error: unknown, res: Response) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: "Invalid input", errors: error.issues });
  }
  if (error instanceof Error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
};
