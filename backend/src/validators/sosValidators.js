import { z } from 'zod';

export const createSosSchema = z.object({
  emergency_type: z.enum(['medical', 'fire', 'flood', 'accident', 'trapped', 'missing_person', 'road_blockage', 'infrastructure_damage', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().max(1000).optional().default(''),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().max(300).optional(),
});

export const updateSosStatusSchema = z.object({
  status: z.enum(['received', 'triaged', 'responder_assigned', 'dispatched', 'en_route', 'arrived', 'resolved', 'cancelled']),
  note: z.string().max(500).optional(),
});

export const assignResponderSchema = z.object({
  responder_id: z.string().uuid(),
});

export const confirmTriageSchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});
