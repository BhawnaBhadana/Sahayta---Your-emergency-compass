import { z } from 'zod';

export const createMissingPersonSchema = z.object({
  name: z.string().min(2).max(150),
  age: z.coerce.number().int().min(0).max(130).optional(),
  description: z.string().max(1000).optional(),
  last_seen_location: z.string().max(300).optional(),
  last_seen_at: z.string().datetime().optional(),
  photo_url: z.string().url().optional(),
  contact_phone: z.string().max(20).optional(),
});

export const updateMissingPersonStatusSchema = z.object({
  status: z.enum(['missing', 'potential_match', 'verified', 'located', 'identity_verified', 'reunited', 'found', 'closed']),
});
