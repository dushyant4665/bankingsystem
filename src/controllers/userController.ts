import { Response } from "express";
import { prisma } from "../config/database";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { handleError } from "../middleware/errorHandler";

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { account: true },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (e) {
    handleError(e, res);
  }
};
