import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { createTenancySchema } from './tenancy.schema.js';
import {
  createTenancy,
  listTenancies,
  getTenancy,
  endTenancy,
} from './tenancy.service.js';

const router = Router();

router.use(authenticate, authorize('LANDLORD'));

// POST /api/tenancies
router.post('/', validateBody(createTenancySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenancy = await createTenancy(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      data: { tenancy },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenancies?unitId=<uuid>
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
    const tenancies = await listTenancies(req.user!.id, unitId);

    res.status(200).json({
      success: true,
      data: { tenancies },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenancies/:tenancyId
router.get('/:tenancyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenancy = await getTenancy(req.user!.id, req.params.tenancyId as string);

    res.status(200).json({
      success: true,
      data: { tenancy },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tenancies/:tenancyId/end
router.patch('/:tenancyId/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenancy = await endTenancy(req.user!.id, req.params.tenancyId as string);

    res.status(200).json({
      success: true,
      data: { tenancy },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
