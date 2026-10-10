import { z } from 'zod';

export const updateUserProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, 'Display name cannot be empty')
      .max(100, 'Display name cannot exceed 100 characters')
      .optional(),
  })
  .strict();

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;
