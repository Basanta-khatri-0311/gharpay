import { Router } from 'express';

import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { createAccessToken } from './token.service.js';

import { rotateRefreshToken, revokeRefreshToken } from './refresh-token.service.js';
import { validateBody } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerUser, loginUser } from './auth.service.js';

const authRouter = Router();

const REFRESH_COOKIE_NAME = 'gharpay_refresh';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
};

authRouter.post(
  '/register',
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const user = await registerUser(req.body);

      res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const result = await loginUser(req.body);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        refreshCookieOptions,
      );

      const { refreshToken: _refreshToken, ...responseData } = result;

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (typeof rawToken !== 'string' || !rawToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const result = await rotateRefreshToken(rawToken);
    const accessToken = await createAccessToken(result.user);

    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      refreshCookieOptions,
    );

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 900,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await revokeRefreshToken(
      typeof rawToken === 'string' ? rawToken : undefined,
    );

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      path: '/api/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default authRouter;