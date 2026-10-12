
import { z } from 'zod';

export const submitPaymentSchema = z.object({
  billId: z.string().uuid(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number with up to 2 decimal places')
    .refine((v) => Number(v) > 0, { message: 'Amount must be greater than zero' }),
  method: z.enum(['ESEWA', 'FONEPAY', 'BANK_TRANSFER', 'CASH', 'OTHER']),
  transactionReference: z.string().trim().min(1).max(255),
  proofUrl: z.string().url('Proof URL must be a valid URL').optional(),
});

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>;
