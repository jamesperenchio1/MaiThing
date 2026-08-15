import i18n from 'i18next';
import { z } from 'zod';

const PHONE_REGEX = /^[0-9+\-\s()]{9,15}$/;
const phoneField = z
  .string()
  .optional()
  .refine(
    (val) => !val || PHONE_REGEX.test(val),
    (val) => ({
      message: i18n.t('validation.phoneInvalid'),
    })
  );

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: phoneField,
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    () => ({
      message: i18n.t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    })
  );

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const otpSchema = z.object({
  code: z.string().length(6),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  phone: phoneField,
  preferredLanguage: z.enum(['en', 'th']),
});

export type SignInForm = z.infer<typeof signInSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type OtpForm = z.infer<typeof otpSchema>;
export type ProfileForm = z.infer<typeof profileSchema>;
