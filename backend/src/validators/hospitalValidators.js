import { z } from 'zod';

export const createHospitalSchema = z.object({
  name: z.string().min(2).max(150),
  address: z.string().max(300).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  total_beds: z.coerce.number().int().min(0).default(0),
  available_beds: z.coerce.number().int().min(0).default(0),
  icu_beds: z.coerce.number().int().min(0).default(0),
  icu_available: z.coerce.number().int().min(0).default(0),
  ambulances_available: z.coerce.number().int().min(0).default(0),
  contact_phone: z.string().max(20).optional(),
});

export const updateCapacitySchema = z.object({
  available_beds: z.coerce.number().int().min(0).optional(),
  icu_available: z.coerce.number().int().min(0).optional(),
  ambulances_available: z.coerce.number().int().min(0).optional(),
  emergency_capacity_status: z.enum(['available', 'limited', 'full']).optional(),
});
