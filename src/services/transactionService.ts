import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

type MoneyInput = {
  userId: string;
  amount: number;
  note?: string;
  idempotencyKey?: string;
};

type TransferInput = MoneyInput & {
  toAccountNumber: string;
};

type TxClient = Prisma.TransactionClient;

const MAX_TRANSACTION_RETRIES = 3;

async function lockAccount(tx: TxClient, accountId: string) {
  await tx.$queryRaw`SELECT id FROM "Account" WHERE id = ${accountId} FOR UPDATE`;
}

async function lockAccounts(tx: TxClient, accountIds: string[]) {
  // Sort first so every transfer locks rows in the same order and avoids deadlocks.
  const uniqueAccountIds = [...new Set(accountIds)].sort();

  for (const accountId of uniqueAccountIds) {
    await lockAccount(tx, accountId);
  }
}

async function getUserAccount(tx: TxClient, userId: string) {
  const account = await tx.account.findUnique({
    where: { userId },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  return account;
}

async function getAccountByNumber(tx: TxClient, accountNumber: string) {
  const account = await tx.account.findUnique({
    where: { accountNumber },
  });

  if (!account) {
    throw new Error("Destination account not found");
  }

  return account;
}

function ensureActive(account: { isFrozen: boolean }) {
  if (account.isFrozen) {
    throw new Error("Account is frozen");
  }
}

async function createLedgerEntry(
  tx: TxClient,
  input: {
    accountId: string;
    transactionId?: string;
    entryType: "CREDIT" | "DEBIT";
    amount: number;
    balanceAfter: number;
    note?: string;
  }
) {
  return tx.ledgerEntry.create({
    data: input,
  });
}

function isRetryableTransactionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { code?: string; message?: string };

  return (
    err.code === "P2034" ||
    err.message?.includes("deadlock") ||
    err.message?.includes("serialization")
  );
}

function isUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (error as { code?: string }).code === "P2002";
}

async function runSerializableTransaction<T>(work: (tx: TxClient) => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      lastError = error;

      if (attempt < MAX_TRANSACTION_RETRIES && isRetryableTransactionError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

async function runIdempotentTransaction<T>(
  idempotencyKey: string | undefined,
  work: (tx: TxClient) => Promise<T>
) {
  try {
    return await runSerializableTransaction(work);
  } catch (error) {
    if (!idempotencyKey || !isUniqueConstraintError(error)) {
      throw error;
    }

    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return existing as T;
    }

    throw error;
  }
}

async function getExistingTransaction(tx: TxClient, idempotencyKey?: string) {
  if (!idempotencyKey) {
    return null;
  }

  return tx.transaction.findUnique({
    where: { idempotencyKey },
  });
}

export class TransactionService {
  static async getBalance(userId: string) {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        isFrozen: true,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      balance: account.balance,
      isFrozen: account.isFrozen,
    };
  }

  static async deposit(input: MoneyInput) {
    if (input.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    return runIdempotentTransaction(input.idempotencyKey, async (tx) => {
      const existing = await getExistingTransaction(tx, input.idempotencyKey);

      if (existing) {
        return existing;
      }

      const account = await getUserAccount(tx, input.userId);
      await lockAccount(tx, account.id);

      const fresh = await tx.account.findUnique({
        where: { id: account.id },
      });

      if (!fresh) {
        throw new Error("Account not found");
      }

      ensureActive(fresh);

      const updated = await tx.account.update({
        where: { id: fresh.id },
        data: { balance: { increment: input.amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          toAccountId: updated.id,
          amount: input.amount,
          type: "CREDIT",
          note: input.note,
          idempotencyKey: input.idempotencyKey,
        },
      });

      await createLedgerEntry(tx, {
        accountId: updated.id,
        transactionId: transaction.id,
        entryType: "CREDIT",
        amount: input.amount,
        balanceAfter: updated.balance,
        note: input.note,
      });

      await tx.auditLog.create({
        data: {
          userId: input.userId,
          action: "DEPOSIT",
          details: JSON.stringify({
            amount: input.amount,
            accountNumber: updated.accountNumber,
          }),
        },
      });

      return transaction;
    });
  }

  static async withdraw(input: MoneyInput) {
    if (input.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    return runIdempotentTransaction(input.idempotencyKey, async (tx) => {
      const existing = await getExistingTransaction(tx, input.idempotencyKey);

      if (existing) {
        return existing;
      }

      const account = await getUserAccount(tx, input.userId);
      await lockAccount(tx, account.id);

      const fresh = await tx.account.findUnique({ where: { id: account.id } });

      if (!fresh) {
        throw new Error("Account not found");
      }

      ensureActive(fresh);

      if (fresh.balance < input.amount) {
        throw new Error("Insufficient balance");
      }

      const updated = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: input.amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          fromAccountId: updated.id,
          amount: input.amount,
          type: "DEBIT",
          note: input.note,
          idempotencyKey: input.idempotencyKey,
        },
      });

      await createLedgerEntry(tx, {
        accountId: updated.id,
        transactionId: transaction.id,
        entryType: "DEBIT",
        amount: input.amount,
        balanceAfter: updated.balance,
        note: input.note,
      });

      await tx.auditLog.create({
        data: {
          userId: input.userId,
          action: "WITHDRAWAL",
          details: JSON.stringify({
            amount: input.amount,
            accountNumber: updated.accountNumber,
          }),
        },
      });

      return transaction;
    });
  }

  static async transfer(input: TransferInput) {
    if (input.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    return runIdempotentTransaction(input.idempotencyKey, async (tx) => {
      const existing = await getExistingTransaction(tx, input.idempotencyKey);

      if (existing) {
        return existing;
      }

      const fromAccount = await getUserAccount(tx, input.userId);
      const toAccount = await getAccountByNumber(tx, input.toAccountNumber);

      if (fromAccount.id === toAccount.id) {
        throw new Error("Cannot transfer to the same account");
      }

      await lockAccounts(tx, [fromAccount.id, toAccount.id]);

      const freshFrom = await tx.account.findUnique({ where: { id: fromAccount.id } });
      const freshTo = await tx.account.findUnique({ where: { id: toAccount.id } });

      if (!freshFrom || !freshTo) {
        throw new Error("Account not found");
      }

      ensureActive(freshFrom);
      ensureActive(freshTo);

      if (freshFrom.balance < input.amount) {
        throw new Error("Insufficient balance");
      }

      await tx.account.update({
        where: { id: freshFrom.id },
        data: { balance: { decrement: input.amount } },
      });

      await tx.account.update({
        where: { id: freshTo.id },
        data: { balance: { increment: input.amount } },
      });

      // One transfer row represents the movement of money.
      const transaction = await tx.transaction.create({
        data: {
          fromAccountId: freshFrom.id,
          toAccountId: freshTo.id,
          amount: input.amount,
          type: "DEBIT",
          note: input.note,
          idempotencyKey: input.idempotencyKey,
        },
      });

      await createLedgerEntry(tx, {
        accountId: freshFrom.id,
        transactionId: transaction.id,
        entryType: "DEBIT",
        amount: input.amount,
        balanceAfter: freshFrom.balance - input.amount,
        note: input.note,
      });

      await createLedgerEntry(tx, {
        accountId: freshTo.id,
        transactionId: transaction.id,
        entryType: "CREDIT",
        amount: input.amount,
        balanceAfter: freshTo.balance + input.amount,
        note: input.note,
      });

      await tx.auditLog.create({
        data: {
          userId: input.userId,
          action: "TRANSFER",
          details: JSON.stringify({
            amount: input.amount,
            fromAccountNumber: freshFrom.accountNumber,
            toAccountNumber: freshTo.accountNumber,
          }),
        },
      });

      return transaction;
    });
  }

  static async getHistory(userId: string, limit = 10, offset = 0) {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    return prisma.transaction.findMany({
      where: {
        OR: [{ fromAccountId: account.id }, { toAccountId: account.id }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        fromAccount: { select: { accountNumber: true } },
        toAccount: { select: { accountNumber: true } },
      },
    });
  }

  static async getLedger(userId: string, limit = 20, offset = 0) {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    return prisma.ledgerEntry.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            type: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
