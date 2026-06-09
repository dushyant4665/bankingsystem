import { z } from "zod";
import { prisma } from "../config/database";

const moneySchema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().trim().optional(),
});

const transferSchema = moneySchema.extend({
  toAccountNumber: z.string().trim().min(1),
});

async function myAccount(userId: string) {
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) throw new Error("Account not found");
  if (account.isFrozen) throw new Error("Account is frozen");
  return account;
}

export const getBalance = async (userId: string) => myAccount(userId);

export async function depositMoney(userId: string, input: unknown) {
  const data = moneySchema.parse(input);
  const account = await myAccount(userId);

  return prisma.$transaction(async (tx) => {
    const updatedAccount = await tx.account.update({
      where: { id: account.id },
      data: { balance: { increment: data.amount } },
    });

    const transaction = await tx.transaction.create({
      data: { amount: data.amount, type: "CREDIT", note: data.note || "Deposit", toAccountId: account.id },
    });

    await tx.auditLog.create({ data: { userId, action: "DEPOSIT", details: `Amount ${data.amount}` } });

    return { account: updatedAccount, transaction };
  });
}

export async function withdrawMoney(userId: string, input: unknown) {
  const data = moneySchema.parse(input);
  const account = await myAccount(userId);

  if (account.balance < data.amount) throw new Error("Insufficient balance");

  return prisma.$transaction(async (tx) => {
    const updatedAccount = await tx.account.update({
      where: { id: account.id },
      data: { balance: { decrement: data.amount } },
    });

    const transaction = await tx.transaction.create({
      data: { amount: data.amount, type: "DEBIT", note: data.note || "Withdraw", fromAccountId: account.id },
    });

    await tx.auditLog.create({ data: { userId, action: "WITHDRAW", details: `Amount ${data.amount}` } });

    return { account: updatedAccount, transaction };
  });
}

export async function transferMoney(userId: string, input: unknown) {
  const data = transferSchema.parse(input);
  const sender = await myAccount(userId);

  if (sender.accountNumber === data.toAccountNumber) throw new Error("Cannot transfer to same account");
  if (sender.balance < data.amount) throw new Error("Insufficient balance");

  const receiver = await prisma.account.findUnique({ where: { accountNumber: data.toAccountNumber } });
  if (!receiver) throw new Error("Receiver account not found");
  if (receiver.isFrozen) throw new Error("Receiver account is frozen");

  return prisma.$transaction(async (tx) => {
    await tx.account.update({ where: { id: sender.id }, data: { balance: { decrement: data.amount } } });
    await tx.account.update({ where: { id: receiver.id }, data: { balance: { increment: data.amount } } });

    const transaction = await tx.transaction.create({
      data: { amount: data.amount, type: "DEBIT", note: data.note || "Transfer", fromAccountId: sender.id, toAccountId: receiver.id },
    });

    await tx.auditLog.create({
      data: { userId, action: "TRANSFER", details: `${sender.accountNumber} to ${receiver.accountNumber}, amount ${data.amount}` },
    });

    return transaction;
  });
}

export const getHistory = async (userId: string) => {
  const account = await myAccount(userId);
  return prisma.transaction.findMany({
    where: { OR: [{ fromAccountId: account.id }, { toAccountId: account.id }] },
    orderBy: { createdAt: "desc" },
  });
};
