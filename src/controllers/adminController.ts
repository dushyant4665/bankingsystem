import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { handleError } from "../middleware/errorHandler";
import * as svc from "../services/adminService";

export const dashboard = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    return res.json({ success: true, data: await svc.getDashboard() });
  } catch (error) {
    handleError(error, res);
  }
};

export const users = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    return res.json({ success: true, data: await svc.getUsers() });
  } catch (error) {
    handleError(error, res);
  }
};

export const freezeAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await svc.changeFreezeStatus(req.user!.id, String(req.params.accountNumber), true);
    return res.json({ success: true, data: account });
  } catch (error) {
    handleError(error, res);
  }
};

export const unfreezeAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await svc.changeFreezeStatus(req.user!.id, String(req.params.accountNumber), false);
    return res.json({ success: true, data: account });
  } catch (error) {
    handleError(error, res);
  }
};

export const auditLogs = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    return res.json({ success: true, data: await svc.getAuditLogs() });
  } catch (error) {
    handleError(error, res);
  }
};
