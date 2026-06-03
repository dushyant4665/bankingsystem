import { z } from "zod";
import { prisma } from "../config/database";

const transferSchema = z.object({
  toAccountNumber: z.string().trim().min(1, "Receiver account number is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  note: z.string().trim().optional(),
  idempotencyKey: z.string().trim().min(8, "Idempotency key must be at least 8 characters").optional(),
});

type TransferInput = z.infer<typeof transferSchema>;

const MAX_TRANSFER_AMOUNT = 50000;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function checkTransferRules(amount: number) {
  if (amount > MAX_TRANSFER_AMOUNT) {
    throw new Error("Transfer blocked by anomaly rule: amount is too high");
  }
}

export async function getUserAccount(userId: string) {
  const account = await prisma.account.findUnique({
    where: { userId },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  return account;
}

export async function getBalance(userId: string) {
  const account = await getUserAccount(userId);

  return {
    accountNumber: account.accountNumber,
    balance: account.balance,
  };
}

export async function getHistory(userId: string, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT) {
  const account = await getUserAccount(userId);
  const safePage = Math.max(page, DEFAULT_PAGE);
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const where = {
    OR: [{ fromAccountId: account.id }, { toAccountId: account.id }],
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.transaction.count({ where }),
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

export async function transferMoney(userId: string, input: TransferInput) {
  const data = transferSchema.parse(input);
  const sender = await getUserAccount(userId);

  checkTransferRules(data.amount);

  if (data.idempotencyKey) {
    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });

    if (existingTransaction) {
      return existingTransaction;
    }
  }

  if (sender.accountNumber === data.toAccountNumber) {
    throw new Error("Cannot transfer money to the same account");
  }

  if (sender.isFrozen) {
    throw new Error("Sender account is frozen");
  }

  const receiver = await prisma.account.findUnique({
    where: { accountNumber: data.toAccountNumber },
  });

  if (!receiver) {
    throw new Error("Receiver account not found");
  }

  if (receiver.isFrozen) {
    throw new Error("Receiver account is frozen");
  }

  if (sender.balance < data.amount) {
    throw new Error("Insufficient balance");
  }

  return prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: sender.id },
      data: { balance: { decrement: data.amount } },
    });

    await tx.account.update({
      where: { id: receiver.id },
      data: { balance: { increment: data.amount } },
    });

    const transaction = await tx.transaction.create({
      data: {
        amount: data.amount,
        type: "DEBIT",
        idempotencyKey: data.idempotencyKey,
        note: data.note,
        fromAccountId: sender.id,
        toAccountId: receiver.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "TRANSFER_CREATED",
        details: `${sender.accountNumber} to ${receiver.accountNumber}, amount ${data.amount}`,
      },
    });

    return transaction;
  });
}
