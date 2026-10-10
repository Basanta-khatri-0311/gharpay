import { Router } from 'express';

import { validateBody } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerUser, loginUser } from './auth.service.js';

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

authRouter.post(
  '/login',
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const result = await loginUser(req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default authRouter;