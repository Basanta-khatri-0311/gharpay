import { Router } from 'express';

import { validateBody } from '../../middleware/validate.js';
import { registerSchema } from './auth.schema.js';
import { registerUser } from './auth.service.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const user = await registerUser(req.body);

      res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default authRouter;