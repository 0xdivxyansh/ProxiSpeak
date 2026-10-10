import { z } from 'zod';
import { env } from '../../config/env';

export const nearbyAudioQuerySchema = z.object({
  lat: z.coerce
    .number()
    .refine((v) => !isNaN(v) && isFinite(v), 'Latitude must be a valid finite number')
    .refine((v) => v >= -90 && v <= 90, 'Latitude must be between -90 and 90 degrees'),
  lng: z.coerce
    .number()
    .refine((v) => !isNaN(v) && isFinite(v), 'Longitude must be a valid finite number')
    .refine((v) => v >= -180 && v <= 180, 'Longitude must be between -180 and 180 degrees'),
  radius: z.coerce
    .number()
    .refine((v) => !isNaN(v) && isFinite(v), 'Radius must be a valid number')
    .refine((v) => v > 0, 'Radius must be greater than 0 meters')
    .refine(
      (v) => v <= env.MAX_DISCOVERY_RADIUS_METERS,
      `Radius cannot exceed maximum configured limit of ${env.MAX_DISCOVERY_RADIUS_METERS} meters`,
    )
    .default(env.DEFAULT_DISCOVERY_RADIUS_METERS),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(env.MAX_DISCOVERY_PAGE_LIMIT, `Limit cannot exceed ${env.MAX_DISCOVERY_PAGE_LIMIT}`)
    .default(env.DEFAULT_DISCOVERY_PAGE_LIMIT),
  cursor: z.string().trim().optional(),
});

export type NearbyAudioQueryParams = z.infer<typeof nearbyAudioQuerySchema>;
