import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { BadRequestError } from '../lib/errors.js';

export const validateBody = <T>(schema: ZodType<T>): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequestError(
        'Request validation failed',
        result.error.flatten(),
      );
    }

    req.body = result.data;

    next();
  };
};