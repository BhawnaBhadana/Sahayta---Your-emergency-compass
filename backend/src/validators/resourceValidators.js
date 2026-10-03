import { z } from 'zod';

export const createResourceSchema = z.object({
  category: z.enum(['food', 'water', 'medicine', 'blankets', 'first_aid', 'baby_supplies', 'clothing', 'other']),
  name: z.string().min(2).max(150),
  quantity: z.coerce.number().int().min(0),
  unit: z.string().max(30).default('units'),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  location_label: z.string().max(200).optional(),
  shelter_id: z.string().uuid().optional(),
});

export const updateResourceSchema = z.object({
  quantity: z.coerce.number().int().min(0).optional(),
  status: z.enum(['available', 'low', 'critical', 'out_of_stock']).optional(),
});

export const createResourceRequestSchema = z.object({
  requesting_shelter_id: z.string().uuid(),
  category: z.enum(['food', 'water', 'medicine', 'blankets', 'first_aid', 'baby_supplies', 'clothing', 'other']),
  quantity_needed: z.coerce.number().int().min(1),
  fulfilling_resource_id: z.string().uuid().optional(),
});

export const updateResourceRequestSchema = z.object({
  status: z.enum(['requested', 'approved', 'dispatched', 'delivered', 'rejected']),
});
