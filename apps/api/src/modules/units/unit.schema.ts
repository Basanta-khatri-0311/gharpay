
import { z } from 'zod';

export const createUnitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum([
    'ROOM',
    'APARTMENT',
    'FLAT',
    'SHOP',
    'OTHER',
  ]),
  monthlyRent: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Monthly rent must be a valid amount with up to 2 decimal places')
    .refine((value) => Number(value) > 0, {
      message: 'Monthly rent must be greater than zero',
    }),
});

export const updateUnitSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    type: z
      .enum([
        'ROOM',
        'APARTMENT',
        'FLAT',
        'SHOP',
        'OTHER',
      ])
      .optional(),
    monthlyRent: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Monthly rent must be a valid amount with up to 2 decimal places')
      .refine((value) => Number(value) > 0, {
        message: 'Monthly rent must be greater than zero',
      })
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: 'At least one field must be provided',
    },
  );

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
