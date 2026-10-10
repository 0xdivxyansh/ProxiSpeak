import { z } from 'zod';
import { env } from '../../config/env';

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
] as const;

export const createAudioSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(100, 'Title cannot exceed 100 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .default(''),
    latitude: z
      .number()
      .refine((v) => !isNaN(v) && isFinite(v), 'Latitude must be a valid finite number')
      .refine((v) => v >= -90 && v <= 90, 'Latitude must be between -90 and 90 degrees'),
    longitude: z
      .number()
      .refine((v) => !isNaN(v) && isFinite(v), 'Longitude must be a valid finite number')
      .refine((v) => v >= -180 && v <= 180, 'Longitude must be between -180 and 180 degrees'),
    visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
    declaredMimeType: z
      .string()
      .toLowerCase()
      .refine(
        (val) => (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(val),
        `Unsupported audio MIME type. Allowed types: ${ALLOWED_AUDIO_MIME_TYPES.join(', ')}`,
      ),
    declaredSizeBytes: z
      .number()
      .int('File size must be an integer')
      .positive('File size must be positive')
      .max(
        env.MAX_AUDIO_FILE_SIZE_BYTES,
        `File size exceeds maximum permitted limit of ${env.MAX_AUDIO_FILE_SIZE_BYTES} bytes (${Math.round(env.MAX_AUDIO_FILE_SIZE_BYTES / (1024 * 1024))}MB)`,
      ),
  })
  .strict();

export const updateAudioSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(100, 'Title cannot exceed 100 characters')
      .optional(),
    description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
    visibility: z.enum(['public', 'private', 'unlisted']).optional(),
    latitude: z
      .number()
      .refine((v) => !isNaN(v) && isFinite(v), 'Latitude must be a valid finite number')
      .refine((v) => v >= -90 && v <= 90, 'Latitude must be between -90 and 90 degrees')
      .optional(),
    longitude: z
      .number()
      .refine((v) => !isNaN(v) && isFinite(v), 'Longitude must be a valid finite number')
      .refine((v) => v >= -180 && v <= 180, 'Longitude must be between -180 and 180 degrees')
      .optional(),
  })
  .strict();

export const audioIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Audio ID cannot be empty').max(128, 'Audio ID is too long'),
});

export type CreateAudioDto = z.infer<typeof createAudioSchema>;
export type UpdateAudioDto = z.infer<typeof updateAudioSchema>;
export type AudioIdParamDto = z.infer<typeof audioIdParamSchema>;
