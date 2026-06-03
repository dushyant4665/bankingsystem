import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/database";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }

  return secret;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: "Authorization token is required" });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;

    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      res.status(401).json({ message: "Invalid authorization token" });
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid authorization token" });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }

    req.user!.role = user.role;
    next();
  });
}
