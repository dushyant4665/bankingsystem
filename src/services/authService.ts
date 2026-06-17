import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";

type SignupInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

function createAccountNumber() {
  return `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function createToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function selectUserShape() {
  return {
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
        isFrozen: true,
      },
    },
  } as const;
}

export class AuthService {
  static async signup(input: SignupInput) {
    const email = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const role = process.env.ADMIN_EMAIL?.toLowerCase() === email ? "ADMIN" : "CUSTOMER";

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || null,
        passwordHash,
        role,
        account: {
          create: {
            accountNumber: createAccountNumber(),
            balance: 0,
          },
        },
      },
      select: selectUserShape(),
    });

    return {
      user,
      token: createToken({ id: user.id, email: user.email, role: user.role }),
    };
  }

  static async login(input: LoginInput) {
    const email = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        passwordHash: true,
        account: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            isFrozen: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new Error("Invalid email or password");
    }

    const { passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      token: createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role }),
    };
  }
}
