import { prisma } from "../config/database";
import { createAuditLog } from "./auditService";

export async function getDashboard() {
  const [users, accounts, transactions, totalBalance] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.account.aggregate({
      _sum: { balance: true },
    }),
  ]);

  return {
    users,
    accounts,
    transactions,
    totalBalance: totalBalance._sum.balance ?? 0,
  };
}

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      account: {
        select: {
          accountNumber: true,
          balance: true,
          isFrozen: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function setAccountFreeze(adminId: string, accountNumber: string, isFrozen: boolean) {
  const account = await prisma.account.update({
    where: { accountNumber },
    data: { isFrozen },
  });

  await createAuditLog(
    adminId,
    isFrozen ? "ACCOUNT_FROZEN" : "ACCOUNT_UNFROZEN",
    `Account ${accountNumber}`,
  );

  return account;
}

export async function getTransactionAnalytics() {
  const [totalTransfers, totalAmount, largestTransfer, recentTransfers] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.aggregate({
      _sum: { amount: true },
    }),
    prisma.transaction.findFirst({
      orderBy: { amount: "desc" },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalTransfers,
    totalAmount: totalAmount._sum.amount ?? 0,
    largestTransfer,
    recentTransfers,
  };
}
