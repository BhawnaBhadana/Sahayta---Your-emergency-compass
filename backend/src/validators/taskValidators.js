import { z } from 'zod';

export const createTaskSchema = z.object({
  type: z.enum(['food_distribution', 'medical_assistance', 'supply_delivery', 'shelter_support', 'transportation', 'search_assistance', 'road_reporting']),
  title: z.string().min(3).max(150),
  description: z.string().max(1000).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  address: z.string().max(300).optional(),
  related_shelter_id: z.string().uuid().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['open', 'accepted', 'in_progress', 'arrived', 'completed', 'cancelled']),
});
