import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import {
  sendInvitationSchema,
  acceptInvitationSchema,
  cancelInvitationSchema,
} from './invitation.schema.js';
import {
  sendInvitation,
  listInvitations,
  cancelInvitation,
  acceptInvitation,
  listRenterInvitations,
} from './invitation.service.js';

type InvitationParams = { invitationId: string };

const router = Router();

// ─── Landlord: send an invitation ────────────────────────────────────────────
// POST /api/invitations
router.post(
  '/',
  authenticate,
  authorize('LANDLORD'),
  validateBody(sendInvitationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sendInvitation(req.user!.id, req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Landlord: list sent invitations ─────────────────────────────────────────
// GET /api/invitations?unitId=<uuid>&status=<PENDING|ACCEPTED|EXPIRED|CANCELLED>
router.get(
  '/',
  authenticate,
  authorize('LANDLORD'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
      const statusParam = req.query.status;
      const status =
        statusParam === 'PENDING' ||
        statusParam === 'ACCEPTED' ||
        statusParam === 'EXPIRED' ||
        statusParam === 'CANCELLED'
          ? statusParam
          : undefined;

      const invitations = await listInvitations(req.user!.id, unitId, status);

      res.status(200).json({
        success: true,
        data: { invitations },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Landlord: cancel an invitation ──────────────────────────────────────────
// PATCH /api/invitations/:invitationId/cancel
router.patch(
  '/:invitationId/cancel',
  authenticate,
  authorize('LANDLORD'),
  validateBody(cancelInvitationSchema),
  async (req: Request<InvitationParams>, res: Response, next: NextFunction) => {
    try {
      const invitation = await cancelInvitation(req.user!.id, req.params.invitationId);

      res.status(200).json({
        success: true,
        data: { invitation },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Renter: list received invitations ───────────────────────────────────────
// GET /api/invitations/mine
router.get(
  '/mine',
  authenticate,
  authorize('RENTER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invitations = await listRenterInvitations(req.user!.id);

      res.status(200).json({
        success: true,
        data: { invitations },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Renter: accept an invitation via token ───────────────────────────────────
// POST /api/invitations/accept
router.post(
  '/accept',
  authenticate,
  authorize('RENTER'),
  validateBody(acceptInvitationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invitation = await acceptInvitation(req.user!.id, req.body.token);

      res.status(200).json({
        success: true,
        data: { invitation },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
