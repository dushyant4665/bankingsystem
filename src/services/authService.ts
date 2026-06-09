import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/database";

const SECRET = process.env.JWT_SECRET || "default_secret";

const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6),
  phone: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

const makeToken = (user: any) => 
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "7d" });

const makeAccountNumber = () => `ACC${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

export async function signup(input: unknown) {
  const { password, ...data } = signupSchema.parse(input);

  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    throw new Error("Email already exists");
  }

  const user = await prisma.user.create({
    data: {
      ...data,
      passwordHash: await bcrypt.hash(password, 10),
      role: data.email === process.env.ADMIN_EMAIL ? "ADMIN" : "CUSTOMER",
      account: { create: { accountNumber: makeAccountNumber(), balance: 1000 } },
    },
    include: { account: true },
  });

  return { user, token: makeToken(user) };
}

export async function login(input: unknown) {
  const data = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw new Error("Invalid email or password");
  }

  return { user, token: makeToken(user) };
}
