import { prisma } from "../config/database";

export async function createAuditLog(
  userId: string | null,
  action: string,
  details?: unknown
) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      details: details === undefined ? undefined : JSON.stringify(details),
    },
  });
}
