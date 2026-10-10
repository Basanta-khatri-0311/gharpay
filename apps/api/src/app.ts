import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { prisma } from './lib/prisma.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';

import authRouter from './modules/auth/auth.routes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.WEB_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});
app.use('/api/auth', authRouter);
app.use(errorHandler);