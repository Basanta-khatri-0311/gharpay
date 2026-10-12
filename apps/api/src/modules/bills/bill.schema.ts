
import { z } from 'zod';

const billItemSchema = z.object({
  type: z.enum(['RENT', 'ELECTRICITY', 'WATER', 'INTERNET', 'OTHER']),
  description: z.string().trim().min(1).max(255),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number with up to 2 decimal places')
    .refine((v) => Number(v) > 0, { message: 'Amount must be greater than zero' }),
});

export const createBillSchema = z
  .object({
    tenancyId: z.string().uuid(),
    billingMonth: z.coerce.date(),
    dueDate: z.coerce.date(),
    items: z.array(billItemSchema).min(1, 'At least one bill item is required'),
  })
  .refine((data) => data.dueDate >= data.billingMonth, {
    message: 'Due date must be on or after the billing month',
    path: ['dueDate'],
  });

export const updateBillSchema = z
  .object({
    dueDate: z.coerce.date().optional(),
    status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
