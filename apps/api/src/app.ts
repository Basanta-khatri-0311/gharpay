import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { prisma } from './lib/prisma.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authenticate, authorize } from './middleware/authenticate.js';

import authRouter from './modules/auth/auth.routes.js';
import unitRoutes from './modules/units/unit.routes.js';
import propertyRoutes from './modules/properties/property.routes.js';
import tenancyRoutes from './modules/tenancies/tenancy.routes.js';
import billRoutes from './modules/bills/bill.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import paymentMethodRoutes from './modules/payment-methods/payment-method.routes.js';
import invitationRoutes from './modules/invitations/invitation.routes.js';

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
app.use('/api/properties', propertyRoutes);
app.use('/api/properties/:propertyId/units', unitRoutes);
app.use('/api/tenancies', tenancyRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/invitations', invitationRoutes);
app.use(errorHandler);