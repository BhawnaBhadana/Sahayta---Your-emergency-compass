import { z } from 'zod';

export const createIncidentSchema = z.object({
  emergency_type: z.enum(['medical', 'fire', 'flood', 'accident', 'trapped', 'missing_person', 'road_blockage', 'infrastructure_damage', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  title: z.string().min(3).max(150),
  description: z.string().max(1000).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().max(300).optional(),
  photo_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
});

export const verifyIncidentSchema = z.object({
  action: z.enum(['verify', 'reject', 'under_review']),
  rejection_reason: z.string().max(500).optional(),
});
