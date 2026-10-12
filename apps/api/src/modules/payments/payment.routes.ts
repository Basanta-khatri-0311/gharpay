import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { submitPaymentSchema, rejectPaymentSchema } from './payment.schema.js';
import {
  submitPayment,
  listRenterPayments,
  listLandlordPayments,
  getPayment,
  verifyPayment,
  rejectPayment,
} from './payment.service.js';

type PaymentParams = { paymentId: string };

const router = Router();

// ─── Renter: submit a payment ────────────────────────────────────────────────
// POST /api/payments
router.post(
  '/',
  authenticate,
  authorize('RENTER'),
  validateBody(submitPaymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await submitPayment(req.user!.id, req.body);

      res.status(201).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── List payments (role-aware) ──────────────────────────────────────────────
// GET /api/payments?billId=<uuid>&status=<PENDING|VERIFIED|REJECTED>
router.get(
  '/',
  authenticate,
  authorize('LANDLORD', 'RENTER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const billId = typeof req.query.billId === 'string' ? req.query.billId : undefined;

      let payments;

      if (req.user!.role === 'RENTER') {
        payments = await listRenterPayments(req.user!.id, billId);
      } else {
        const statusParam = req.query.status;
        const status =
          statusParam === 'PENDING' || statusParam === 'VERIFIED' || statusParam === 'REJECTED'
            ? statusParam
            : undefined;
        payments = await listLandlordPayments(req.user!.id, billId, status);
      }

      res.status(200).json({
        success: true,
        data: { payments },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Get one payment (role-aware) ────────────────────────────────────────────
// GET /api/payments/:paymentId
router.get(
  '/:paymentId',
  authenticate,
  authorize('LANDLORD', 'RENTER'),
  async (req: Request<PaymentParams>, res: Response, next: NextFunction) => {
    try {
      const payment = await getPayment(req.user!.id, req.user!.role, req.params.paymentId);

      res.status(200).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Landlord: verify a payment ──────────────────────────────────────────────
// PATCH /api/payments/:paymentId/verify
router.patch(
  '/:paymentId/verify',
  authenticate,
  authorize('LANDLORD'),
  async (req: Request<PaymentParams>, res: Response, next: NextFunction) => {
    try {
      const payment = await verifyPayment(req.user!.id, req.params.paymentId);

      res.status(200).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Landlord: reject a payment ──────────────────────────────────────────────
// PATCH /api/payments/:paymentId/reject
router.patch(
  '/:paymentId/reject',
  authenticate,
  authorize('LANDLORD'),
  validateBody(rejectPaymentSchema),
  async (req: Request<PaymentParams>, res: Response, next: NextFunction) => {
    try {
      const payment = await rejectPayment(req.user!.id, req.params.paymentId, req.body);

      res.status(200).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
