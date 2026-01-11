import { z } from 'zod';

// User name validation schema
export const userNameSchema = z.string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .refine(
    (val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val),
    'Name contains invalid characters'
  );

export type ValidationSuccess<T> = { success: true; data: T };
export type ValidationError = { success: false; error: string };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

// Validate and sanitize user name
export function validateUserName(name: string): ValidationResult<string> {
  const result = userNameSchema.safeParse(name);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Invalid name' };
}

// Avatar file validation
export const avatarSchema = z.object({
  size: z.number().max(2 * 1024 * 1024, 'Image must be less than 2MB'),
  type: z.string().refine(
    (type) => type.startsWith('image/'),
    'File must be an image'
  ),
});

// Validate avatar file
export function validateAvatarFile(file: File): ValidationResult<File> {
  const result = avatarSchema.safeParse({
    size: file.size,
    type: file.type,
  });
  if (result.success) {
    return { success: true, data: file };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Invalid file' };
}
