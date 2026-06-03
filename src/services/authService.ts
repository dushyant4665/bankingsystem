import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/database";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Email is invalid").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email is invalid").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

function createAccountNumber() {
  return `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

function createToken(userId: string, email: string) {
  return jwt.sign({ sub: userId, email }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

function getUserRole(email: string) {
  return email === process.env.ADMIN_EMAIL ? "ADMIN" : "CUSTOMER";
}

export async function registerUser(input: RegisterInput) {
  const data = registerSchema.parse(input);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: getUserRole(data.email),
      account: {
        create: {
          accountNumber: createAccountNumber(),
          balance: 1000,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      account: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true,
          balance: true,
        },
      },
    },
  });

  return {
    success: true,
    user,
    token: createToken(user.id, user.email),
  };
}

export async function loginUser(input: LoginInput) {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordOk = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordOk) {
    throw new Error("Invalid email or password");
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    },
    token: createToken(user.id, user.email),
  };
}
