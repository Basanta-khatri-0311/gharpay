
import type { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';

const accessTokenSecret = new TextEncoder().encode(
  env.JWT_ACCESS_SECRET,
);

export interface AuthenticatedUser {
  id: string;
  role: 'LANDLORD' | 'RENTER';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authorization.slice('Bearer '.length).trim();

    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    const { payload } = await jwtVerify(token, accessTokenSecret, {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.sub !== 'string' ||
      (payload.role !== 'LANDLORD' && payload.role !== 'RENTER')
    ) {
      throw new UnauthorizedError('Invalid access token');
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    next(new UnauthorizedError('Invalid or expired access token'));
  }
}

export function authorize(
  ...allowedRoles: AuthenticatedUser['role'][]
) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication is required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
