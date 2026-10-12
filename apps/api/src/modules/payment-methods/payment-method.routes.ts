import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from './payment-method.schema.js';
import {
  createPaymentMethod,
  listPaymentMethods,
  getPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  listActiveMethodsForLandlord,
} from './payment-method.service.js';

type PaymentMethodParams = { paymentMethodId: string };
type LandlordParams = { landlordId: string };

const router = Router();

// ─── Renter: view a landlord's active payment methods ────────────────────────
// GET /api/payment-methods/landlord/:landlordId
// (before authenticate so renters can discover methods without extra auth context)
router.get(
  '/landlord/:landlordId',
  authenticate,
  authorize('RENTER'),
  async (req: Request<LandlordParams>, res: Response, next: NextFunction) => {
    try {
      const methods = await listActiveMethodsForLandlord(req.params.landlordId);

      res.status(200).json({
        success: true,
        data: { methods },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Landlord: manage own payment methods ────────────────────────────────────

router.use(authenticate, authorize('LANDLORD'));

// POST /api/payment-methods
router.post(
  '/',
  validateBody(createPaymentMethodSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const method = await createPaymentMethod(req.user!.id, req.body);

      res.status(201).json({
        success: true,
        data: { method },
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/payment-methods
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const methods = await listPaymentMethods(req.user!.id);

    res.status(200).json({
      success: true,
      data: { methods },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/payment-methods/:paymentMethodId
router.get(
  '/:paymentMethodId',
  async (req: Request<PaymentMethodParams>, res: Response, next: NextFunction) => {
    try {
      const method = await getPaymentMethod(req.user!.id, req.params.paymentMethodId);

      res.status(200).json({
        success: true,
        data: { method },
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/payment-methods/:paymentMethodId
router.patch(
  '/:paymentMethodId',
  validateBody(updatePaymentMethodSchema),
  async (req: Request<PaymentMethodParams>, res: Response, next: NextFunction) => {
    try {
      const method = await updatePaymentMethod(
        req.user!.id,
        req.params.paymentMethodId,
        req.body,
      );

      res.status(200).json({
        success: true,
        data: { method },
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/payment-methods/:paymentMethodId
router.delete(
  '/:paymentMethodId',
  async (req: Request<PaymentMethodParams>, res: Response, next: NextFunction) => {
    try {
      await deletePaymentMethod(req.user!.id, req.params.paymentMethodId);

      res.status(200).json({
        success: true,
        data: { message: 'Payment method deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
