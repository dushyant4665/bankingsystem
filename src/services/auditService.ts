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

export async function getAuditLogs(page = 1, limit = 20) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.auditLog.count(),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}
