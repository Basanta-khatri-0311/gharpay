
import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(3).max(255),
  city: z.string().trim().min(2).max(100),
});

export const updatePropertySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    address: z.string().trim().min(3).max(255).optional(),
    city: z.string().trim().min(2).max(100).optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: 'At least one field must be provided',
    },
  );

export type CreatePropertyInput = z.infer<
  typeof createPropertySchema
>;

export type UpdatePropertyInput = z.infer<
  typeof updatePropertySchema
>;
