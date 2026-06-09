import { prisma } from "../config/database";

export async function getDashboard() {
  const [users, accounts, transactions, balance] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.account.aggregate({ _sum: { balance: true } }),
  ]);

  return { users, accounts, transactions, totalBalance: balance._sum.balance || 0 };
}

export const getUsers = () => 
  prisma.user.findMany({ include: { account: true }, orderBy: { createdAt: "desc" } });

export async function changeFreezeStatus(adminId: string, accountNumber: string, frozen: boolean) {
  const account = await prisma.account.update({
    where: { accountNumber },
    data: { isFrozen: frozen },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: frozen ? "ACCOUNT_FROZEN" : "ACCOUNT_UNFROZEN", details: accountNumber },
  });

  return account;
}

export const getAuditLogs = () => prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
