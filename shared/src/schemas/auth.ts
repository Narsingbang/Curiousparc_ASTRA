import { z } from 'zod';
import { USER_ROLES, BLOOD_GROUPS } from '../constants';

export const SignUpSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name must not exceed 80 characters'),
    email: z.string().trim().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(USER_ROLES).default('patient'),
    staff_code: z.string().trim().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.role === 'staff' && (!data.staff_code || data.staff_code.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Staff access code is required for hospital staff registration',
      path: ['staff_code'],
    }
  );

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type SignInInput = z.infer<typeof SignInSchema>;

export const ClaimStaffSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(6, 'Staff code must be at least 6 characters')
      .max(64, 'Staff code must not exceed 64 characters'),
    hospital_id: z.string().uuid('Invalid hospital ID format'),
  })
  .strict();

export type ClaimStaffInput = z.infer<typeof ClaimStaffSchema>;

export const ResetPasswordSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
  })
  .strict();

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const UpdatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  })
  .strict();

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  role: z.enum(USER_ROLES),
  hospital_id: z.string().uuid().nullable().optional(),
  phone: z.string().nullable().optional(),
  blood_group: z.enum(BLOOD_GROUPS).nullable().optional(),
  allergies: z.array(z.string()).default([]),
  chronic_conditions: z.array(z.string()).default([]),
  emergency_contact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string().optional(),
    })
    .nullable()
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
