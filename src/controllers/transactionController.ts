import { Response } from "express";
import { ZodError } from "zod";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getBalance, getHistory, transferMoney } from "../services/transactionService";

function handleError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: error.issues,
    });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export async function balance(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await getBalance(req.user!.id);
    res.json({ success: true, account: result });
  } catch (error) {
    handleError(error, res);
  }
}

export async function history(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await getHistory(req.user!.id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(error, res);
  }
}

export async function transfer(req: AuthenticatedRequest, res: Response) {
  try {
    const transaction = await transferMoney(req.user!.id, req.body);
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    handleError(error, res);
  }
}
