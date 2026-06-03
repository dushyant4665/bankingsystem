import { Response } from "express";
import { prisma } from "../config/database";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      account: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true,
          balance: true,
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({ success: true, user });
}
