import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(7).max(20).optional(),
  role: z.enum(['LANDLORD', 'RENTER']),
});

export type RegisterInput = z.infer<typeof registerSchema>;