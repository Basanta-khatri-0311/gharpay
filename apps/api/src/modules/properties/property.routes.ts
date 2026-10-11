
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import {
  createPropertySchema,
  updatePropertySchema,
} from './property.schema.js';
import {
  createProperty,
  listProperties,
  getProperty,
  updateProperty,
} from './property.service.js';

const router = Router();

router.use(authenticate, authorize('LANDLORD'));

router.post('/', validateBody(createPropertySchema), async (req, res, next) => {
  try {
    const property = await createProperty(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      data: { property },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const properties = await listProperties(req.user!.id);

    res.status(200).json({
      success: true,
      data: { properties },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:propertyId', async (req, res, next) => {
  try {
    const property = await getProperty(
      req.user!.id,
      req.params.propertyId as string,
    );

    res.status(200).json({
      success: true,
      data: { property },
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:propertyId',
  validateBody(updatePropertySchema),
  async (req, res, next) => {
    try {
      const property = await updateProperty(
        req.user!.id,
        req.params.propertyId as string,
        req.body,
      );

      res.status(200).json({
        success: true,
        data: { property },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
