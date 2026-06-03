import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getAuditLogs } from "../services/auditService";
import { getDashboard, getTransactionAnalytics, listUsers, setAccountFreeze } from "../services/adminService";

function sendError(error: unknown, res: Response) {
  res.status(400).json({
    success: false,
    message: error instanceof Error ? error.message : "Something went wrong",
  });
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export async function dashboard(_req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getDashboard();
    res.json({ success: true, data });
  } catch (error) {
    sendError(error, res);
  }
}

export async function users(_req: AuthenticatedRequest, res: Response) {
  try {
    const data = await listUsers();
    res.json({ success: true, users: data });
  } catch (error) {
    sendError(error, res);
  }
}

export async function freezeAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const account = await setAccountFreeze(req.user!.id, getParam(req.params.accountNumber), true);
    res.json({ success: true, account });
  } catch (error) {
    sendError(error, res);
  }
}

export async function unfreezeAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const account = await setAccountFreeze(req.user!.id, getParam(req.params.accountNumber), false);
    res.json({ success: true, account });
  } catch (error) {
    sendError(error, res);
  }
}

export async function analytics(_req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getTransactionAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    sendError(error, res);
  }
}

export async function auditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getAuditLogs(page, limit);
    res.json({ success: true, ...data });
  } catch (error) {
    sendError(error, res);
  }
}
