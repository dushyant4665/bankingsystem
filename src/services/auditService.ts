import { prisma } from "../config/database";

export async function createAuditLog(userId: string | null, action: string, details?: string) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      details,
    },
  });
}
