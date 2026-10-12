
import { z } from 'zod';

export const sendInvitationSchema = z.object({
  unitId: z.string().uuid(),
  email: z.string().email().toLowerCase(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export const cancelInvitationSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type CancelInvitationInput = z.infer<typeof cancelInvitationSchema>;
