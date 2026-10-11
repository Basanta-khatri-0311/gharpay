import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import {
  createUnitSchema,
  updateUnitSchema,
} from './unit.schema.js';
import {
  createUnit,
  listUnits,
  getUnit,
  updateUnit,
} from './unit.service.js';

type ParentParams = { propertyId: string };
type UnitParams = { propertyId: string; unitId: string };

const router = Router({ mergeParams: true });

router.use(authenticate, authorize('LANDLORD'));

router.post('/', validateBody(createUnitSchema), async (req: Request<ParentParams>, res: Response, next: NextFunction) => {
  try {
    const unit = await createUnit(
      req.user!.id,
      req.params.propertyId as string,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: { unit },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request<ParentParams>, res: Response, next: NextFunction) => {
  try {
    const units = await listUnits(
      req.user!.id,
      req.params.propertyId as string,
    );

    res.status(200).json({
      success: true,
      data: { units },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:unitId', async (req: Request<UnitParams>, res: Response, next: NextFunction) => {
  try {
    const unit = await getUnit(
      req.user!.id,
      req.params.propertyId as string,
      req.params.unitId as string,
    );

    res.status(200).json({
      success: true,
      data: { unit },
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:unitId',
  validateBody(updateUnitSchema),
  async (req: Request<UnitParams>, res: Response, next: NextFunction) => {
    try {
      const unit = await updateUnit(
        req.user!.id,
        req.params.propertyId as string,
        req.params.unitId as string,
        req.body,
      );

      res.status(200).json({
        success: true,
        data: { unit },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
