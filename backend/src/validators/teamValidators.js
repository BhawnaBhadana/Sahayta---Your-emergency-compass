import { z } from 'zod';

export const createTeamSchema = z.object({
  team_code: z.string().min(2).max(20),
  name: z.string().min(2).max(150),
  type: z.enum(['medical', 'fire_rescue', 'flood_rescue', 'search_rescue', 'general']),
  capabilities: z.array(z.string()).optional().default([]),
  equipment: z.array(z.string()).optional().default([]),
  base_latitude: z.coerce.number().min(-90).max(90).optional(),
  base_longitude: z.coerce.number().min(-180).max(180).optional(),
  contact_phone: z.string().max(20).optional(),
});

export const updateTeamSchema = z.object({
  status: z.enum(['available', 'busy', 'off_duty', 'maintenance']).optional(),
  current_latitude: z.coerce.number().min(-90).max(90).optional(),
  current_longitude: z.coerce.number().min(-180).max(180).optional(),
  capabilities: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
});

export const assignTeamSchema = z.object({
  sos_id: z.string().uuid().optional(),
  incident_id: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const updateAssignmentSchema = z.object({
  status: z.enum(['dispatched', 'en_route', 'arrived', 'completed', 'cancelled']),
});
