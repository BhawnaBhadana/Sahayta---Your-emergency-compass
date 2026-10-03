import { z } from 'zod';

export const updateResponderProfileSchema = z.object({
  skills: z.array(z.string()).optional(),
  is_available: z.coerce.boolean().optional(),
  current_latitude: z.coerce.number().min(-90).max(90).optional(),
  current_longitude: z.coerce.number().min(-180).max(180).optional(),
  vehicle: z.string().max(60).optional(),
});

export const updateVolunteerProfileSchema = z.object({
  skills: z.array(z.string()).optional(),
  is_available: z.coerce.boolean().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  bio: z.string().max(500).optional(),
});

export const routeQuerySchema = z.object({
  start_lat: z.coerce.number().min(-90).max(90),
  start_lng: z.coerce.number().min(-180).max(180),
  end_lat: z.coerce.number().min(-90).max(90),
  end_lng: z.coerce.number().min(-180).max(180),
});
