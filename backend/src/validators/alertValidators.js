import { z } from 'zod';

export const createAlertSchema = z.object({
  type: z.enum(['flood_warning', 'fire', 'earthquake', 'cyclone', 'road_closure', 'shelter_full', 'hospital_shortage', 'resource_shortage', 'public_safety']),
  title: z.string().min(3).max(150),
  description: z.string().max(1000).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  area: z.string().max(150).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().min(0).optional(),
  expires_at: z.string().datetime().optional(),
  recommended_action: z.string().max(500).optional(),
});
