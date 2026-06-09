import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import * as svc from "../services/transactionService";
import { handleError } from "../middleware/errorHandler";

export const balance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, account: await svc.getBalance(req.user!.id) });
  } catch (e) {
    handleError(e, res);
  }
};

export const deposit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.status(201).json({ success: true, ...(await svc.depositMoney(req.user!.id, req.body)) });
  } catch (e) {
    handleError(e, res);
  }
};

export const withdraw = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.status(201).json({ success: true, ...(await svc.withdrawMoney(req.user!.id, req.body)) });
  } catch (e) {
    handleError(e, res);
  }
};

export const transfer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.status(201).json({ success: true, transaction: await svc.transferMoney(req.user!.id, req.body) });
  } catch (e) {
    handleError(e, res);
  }
};

export const history = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, transactions: await svc.getHistory(req.user!.id) });
  } catch (e) {
    handleError(e, res);
  }
};
