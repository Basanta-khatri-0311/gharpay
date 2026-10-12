
import { z } from 'zod';

const paymentMethodType = z.enum(['ESEWA', 'FONEPAY', 'BANK_TRANSFER', 'CASH', 'OTHER']);

export const createPaymentMethodSchema = z.object({
  type: paymentMethodType,
  name: z.string().trim().min(1).max(100),
  accountName: z.string().trim().min(1).max(150).optional(),
  accountNumber: z.string().trim().min(1).max(100).optional(),
  phoneNumber: z.string().trim().min(1).max(20).optional(),
  qrImageUrl: z.string().url('QR image URL must be a valid URL').optional(),
  instructions: z.string().trim().min(1).max(1000).optional(),
});

export const updatePaymentMethodSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    accountName: z.string().trim().min(1).max(150).optional(),
    accountNumber: z.string().trim().min(1).max(100).optional(),
    phoneNumber: z.string().trim().min(1).max(20).optional(),
    qrImageUrl: z.string().url('QR image URL must be a valid URL').optional(),
    instructions: z.string().trim().min(1).max(1000).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
