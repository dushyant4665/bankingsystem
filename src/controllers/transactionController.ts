import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { handleError } from "../middleware/errorHandler";
import { TransactionService } from "../services/transactionService";

function parseAmount(value: unknown) {
  const amount = typeof value === "string" ? Number(value) : value;

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new Error("Amount must be a valid number");
  }

  return amount;
}

function parsePaging(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "string" ? Number(value) : value;
  const safe = typeof parsed === "number" && Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.min(max, Math.max(min, safe));
}

export class TransactionController {
  static async balance(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await TransactionService.getBalance(req.user!.id);
      return res.json({ success: true, data });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async deposit(req: AuthenticatedRequest, res: Response) {
    try {
      const amount = parseAmount(req.body.amount);
      const result = await TransactionService.deposit({
        userId: req.user!.id,
        amount,
        note: req.body.note,
        idempotencyKey: req.body.idempotencyKey,
      });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async withdraw(req: AuthenticatedRequest, res: Response) {
    try {
      const amount = parseAmount(req.body.amount);
      const result = await TransactionService.withdraw({
        userId: req.user!.id,
        amount,
        note: req.body.note,
        idempotencyKey: req.body.idempotencyKey,
      });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async transfer(req: AuthenticatedRequest, res: Response) {
    try {
      const amount = parseAmount(req.body.amount);
      const toAccountNumber = String(req.body.toAccountNumber ?? "").trim();

      if (!toAccountNumber) {
        return res.status(400).json({
          success: false,
          message: "toAccountNumber is required",
        });
      }

      const result = await TransactionService.transfer({
        userId: req.user!.id,
        amount,
        note: req.body.note,
        idempotencyKey: req.body.idempotencyKey,
        toAccountNumber,
      });

      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async history(req: AuthenticatedRequest, res: Response) {
    try {
      const limit = parsePaging(req.query.limit, 10, 1, 100);
      const offset = parsePaging(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);

      const data = await TransactionService.getHistory(req.user!.id, limit, offset);
      return res.json({ success: true, data, pagination: { limit, offset } });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async ledger(req: AuthenticatedRequest, res: Response) {
    try {
      const limit = parsePaging(req.query.limit, 20, 1, 100);
      const offset = parsePaging(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);

      const data = await TransactionService.getLedger(req.user!.id, limit, offset);
      return res.json({ success: true, data, pagination: { limit, offset } });
    } catch (error) {
      handleError(error, res);
    }
  }
}
