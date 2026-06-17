import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";

type JwtPayload = {
  sub?: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: "CUSTOMER" | "ADMIN";
  };
  userId?: string;
};

async function loadUserFromToken(token: string) {
  const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

  if (!decoded.sub) {
    throw new Error("Invalid token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    throw new Error("Invalid token");
  }

  return user;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing bearer token" });
    }

    const user = await loadUserFromToken(token);
    req.user = user;
    req.userId = user.id;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    return next();
  });
}

export const authenticate = requireAuth;
