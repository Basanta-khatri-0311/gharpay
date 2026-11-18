import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { createBillSchema, updateBillSchema } from './bill.schema.js';
import {
  createBill,
  listBills,
  listRenterBills,
  getBill,
  updateBill,
} from './bill.service.js';

type BillParams = { billId: string };

const router = Router();

// ── Renter route (accessible by RENTER role) ─────────────────────────────────
// GET /api/bills/mine  — returns bills for the calling renter's tenancies
router.get('/mine', authenticate, authorize('RENTER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bills = await listRenterBills(req.user!.id);
    res.status(200).json({ success: true, data: { bills } });
  } catch (error) {
    next(error);
  }
});

// ── All routes below require LANDLORD ────────────────────────────────────────
router.use(authenticate, authorize('LANDLORD'));

// POST /api/bills
router.post('/', validateBody(createBillSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await createBill(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      data: { bill },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bills?tenancyId=<uuid>
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenancyId = typeof req.query.tenancyId === 'string' ? req.query.tenancyId : undefined;
    const bills = await listBills(req.user!.id, tenancyId);

    res.status(200).json({
      success: true,
      data: { bills },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bills/:billId
router.get('/:billId', async (req: Request<BillParams>, res: Response, next: NextFunction) => {
  try {
    const bill = await getBill(req.user!.id, req.params.billId);

    res.status(200).json({
      success: true,
      data: { bill },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/bills/:billId
router.patch('/:billId', validateBody(updateBillSchema), async (req: Request<BillParams>, res: Response, next: NextFunction) => {
  try {
    const bill = await updateBill(req.user!.id, req.params.billId, req.body);

    res.status(200).json({
      success: true,
      data: { bill },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
