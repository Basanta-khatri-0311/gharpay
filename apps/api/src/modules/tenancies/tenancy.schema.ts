import { z } from 'zod';

export const createTenancySchema = z.object({
  unitId: z.string().uuid(),
  renterId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => !data.endDate || data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  },
);

export type CreateTenancyInput = z.infer<typeof createTenancySchema>;