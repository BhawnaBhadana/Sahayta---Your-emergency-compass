import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['citizen', 'volunteer', 'responder', 'ngo', 'hospital', 'coordinator', 'admin']),
});

export const setActiveSchema = z.object({
  is_active: z.boolean(),
});
