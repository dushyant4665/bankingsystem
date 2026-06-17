import { Response } from "express";
import { prisma } from "../config/database";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { handleError } from "../middleware/errorHandler";

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          account: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      return res.json({ success: true, data: user });
    } catch (error) {
      handleError(error, res);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, phone } = req.body as { name?: string; phone?: string };

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(name ? { name } : {}),
          ...(phone !== undefined ? { phone } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ success: true, data: user });
    } catch (error) {
      handleError(error, res);
    }
  }
}
