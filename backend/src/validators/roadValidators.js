import { z } from 'zod';

export const reportBlockedRoadSchema = z.object({
  label: z.string().min(2).max(150),
  reason: z.string().max(300).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  lat_start: z.coerce.number().min(-90).max(90),
  lng_start: z.coerce.number().min(-180).max(180),
  lat_end: z.coerce.number().min(-90).max(90),
  lng_end: z.coerce.number().min(-180).max(180),
});
