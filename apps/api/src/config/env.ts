import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: '../../.env',
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(4000),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  WEB_URL: z.string().url(),
  COOKIE_SECURE: z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true'),

COOKIE_SAME_SITE: z
  .enum(['strict', 'lax', 'none'])
  .default('lax'),
});

export const env = envSchema.parse(process.env);