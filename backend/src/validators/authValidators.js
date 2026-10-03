import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  role: z.enum(['citizen', 'volunteer', 'responder', 'ngo', 'hospital', 'coordinator']).default('citizen'),
  phone: z.string().min(6).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
