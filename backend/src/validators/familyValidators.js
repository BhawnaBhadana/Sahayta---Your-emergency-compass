import { z } from 'zod';

export const addFamilyMemberSchema = z.object({
  display_name: z.string().min(1).max(120),
  phone: z.string().max(20).optional(),
});

export const updateFamilyStatusSchema = z.object({
  status: z.enum(['safe', 'needs_help', 'not_responded']),
});
