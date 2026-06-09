import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import * as svc from "../services/adminService";
import { handleError } from "../middleware/errorHandler";

export const dashboard = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, data: await svc.getDashboard() });
  } catch (e) {
    handleError(e, res);
  }
};

export const users = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, users: await svc.getUsers() });
  } catch (e) {
    handleError(e, res);
  }
};

export const freezeAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountNumber } = req.params;
    res.json({ success: true, account: await svc.changeFreezeStatus(req.user!.id, String(accountNumber), true) });
  } catch (e) {
    handleError(e, res);
  }
};

export const unfreezeAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountNumber } = req.params;
    res.json({ success: true, account: await svc.changeFreezeStatus(req.user!.id, String(accountNumber), false) });
  } catch (e) {
    handleError(e, res);
  }
};

export const auditLogs = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, logs: await svc.getAuditLogs() });
  } catch (e) {
    handleError(e, res);
  }
};
