import { prisma } from "../config/database";
import { getRedis } from "../config/redis";
import { createAuditLog } from "./auditService";

const DASHBOARD_CACHE_KEY = "admin:dashboard";
const DASHBOARD_CACHE_TTL_SECONDS = 30;

type DashboardSummary = {
  users: number;
  accounts: number;
  transactions: number;
  totalBalance: number;
};

export async function getDashboard(): Promise<DashboardSummary> {
  const redis = await getRedis();

  if (redis) {
    const cached = await redis.get(DASHBOARD_CACHE_KEY);

    if (cached) {
      return JSON.parse(cached) as DashboardSummary;
    }
  }

  const [users, accounts, transactions, totalBalance] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.account.aggregate({ _sum: { balance: true } }),
  ]);

  const summary = {
    users,
    accounts,
    transactions,
    totalBalance: totalBalance._sum.balance ?? 0,
  };

  if (redis) {
    await redis.set(DASHBOARD_CACHE_KEY, JSON.stringify(summary), "EX", DASHBOARD_CACHE_TTL_SECONDS);
  }

  return summary;
}

async function clearDashboardCache() {
  const redis = await getRedis();

  if (redis) {
    await redis.del(DASHBOARD_CACHE_KEY);
  }
}

export function getUsers() {
  return prisma.user.findMany({
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
          isFrozen: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function changeFreezeStatus(
  adminId: string,
  accountNumber: string,
  frozen: boolean
) {
  const account = await prisma.account.update({
    where: { accountNumber },
    data: { isFrozen: frozen },
  });

  await createAuditLog(adminId, frozen ? "ACCOUNT_FROZEN" : "ACCOUNT_UNFROZEN", {
    accountNumber,
    accountId: account.id,
  });

  await clearDashboardCache();

  return account;
}

export function getAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}
