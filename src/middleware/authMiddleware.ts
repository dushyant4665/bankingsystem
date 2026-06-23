import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";

type JwtPayload = {
  sub?: string;
};

function extractBearerToken(headerValue: string | undefined) {
  if (!headerValue?.startsWith("Bearer ")) {
    return "";
  }

  return headerValue.slice(7);
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

function unauthorized(res: Response, message: string) {
  return res.status(401).json({ success: false, message });
}

function forbidden(res: Response, message: string) {
  return res.status(403).json({ success: false, message });
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
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return unauthorized(res, "Missing bearer token");
    }

    const user = await loadUserFromToken(token);
    req.user = user;
    req.userId = user.id;
    return next();
  } catch {
    return unauthorized(res, "Unauthorized");
  }
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return unauthorized(res, "Missing bearer token");
    }

    const user = await loadUserFromToken(token);
    req.user = user;
    req.userId = user.id;

    if (user.role !== "ADMIN") {
      return forbidden(res, "Admin access required");
    }

    return next();
  } catch {
    return unauthorized(res, "Unauthorized");
  }
}

export const authenticate = requireAuth;
