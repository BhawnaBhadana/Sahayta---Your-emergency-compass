import { z } from 'zod';

export const createShelterSchema = z.object({
  name: z.string().min(2).max(150),
  address: z.string().max(300).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  capacity: z.coerce.number().int().min(0),
  has_food: z.coerce.boolean().default(false),
  has_water: z.coerce.boolean().default(false),
  has_medical: z.coerce.boolean().default(false),
  is_women_safe: z.coerce.boolean().default(false),
  has_children_area: z.coerce.boolean().default(false),
  is_accessible: z.coerce.boolean().default(false),
  contact_phone: z.string().max(20).optional(),
});

export const updateOccupancySchema = z.object({
  occupied: z.coerce.number().int().min(0),
});
