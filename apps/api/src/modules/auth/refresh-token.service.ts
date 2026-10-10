
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { UnauthorizedError } from '../../lib/errors.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

export async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(rawToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return rawToken;
}

export async function rotateRefreshToken(
  rawToken: string,
) {
  const oldTokenHash = hashRefreshToken(rawToken);
  const newRawToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRawToken);
  const newExpiry = getRefreshTokenExpiry();

  const user = await prisma.$transaction(async (tx) => {
    const existingToken = await tx.refreshToken.findUnique({
      where: { tokenHash: oldTokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (
      !existingToken ||
      existingToken.revokedAt ||
      existingToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Revoke only if this token is still active.
    // This also prevents two concurrent refresh requests from
    // successfully rotating the same token.
    const revoked = await tx.refreshToken.updateMany({
      where: {
        id: existingToken.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revoked.count !== 1) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await tx.refreshToken.create({
      data: {
        userId: existingToken.userId,
        tokenHash: newTokenHash,
        expiresAt: newExpiry,
      },
    });

    return existingToken.user;
  });

  return {
    user,
    refreshToken: newRawToken,
  };
}

export async function revokeRefreshToken(
  rawToken: string | undefined,
): Promise<void> {
  if (!rawToken) return;

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(rawToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
