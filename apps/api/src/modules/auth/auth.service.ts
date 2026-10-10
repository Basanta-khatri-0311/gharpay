import argon2 from 'argon2';

import { prisma } from '../../lib/prisma.js';
import { AppError, UnauthorizedError } from '../../lib/errors.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import { createAccessToken } from './token.service.js';

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(
      409,
      'EMAIL_ALREADY_REGISTERED',
      'An account with this email already exists',
    );
  }

  const passwordHash = await argon2.hash(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        phone: input.phone,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    // The database unique constraint protects against simultaneous
    // registration attempts using the same email.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'An account with this email already exists',
      );
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const email = input.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordIsValid = await argon2.verify(
    user.passwordHash,
    input.password,
  );

  if (!passwordIsValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const accessToken = await createAccessToken({
    id: user.id,
    role: user.role,
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken,
    tokenType: 'Bearer' as const,
    expiresIn: 900,
  };
}