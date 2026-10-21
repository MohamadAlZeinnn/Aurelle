// Zod schemas shared by forms and the demo server. A production API must validate
// independently with equivalent rules (e.g. FluentValidation in .NET).
import { z } from 'zod';
import { GOVERNORATES } from '../constants/lebanon.js';
import { isValidLebanesePhone } from './phone.js';

const trimmed = (min, msg, max = 120) => z.string().trim().min(min, msg).max(max, `Please keep this under ${max} characters.`);

export const emailSchema = z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address, like name@example.com.');

export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Enter your mobile number.')
  .refine(isValidLebanesePhone, 'Enter a Lebanese mobile number, e.g. 03 123 456 or 71 123 456.');

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/\d/, 'Include at least one number.');

export const addressFields = {
  governorate: z.string().min(1, 'Choose your governorate.'),
  district: z.string().min(1, 'Choose your district.'),
  city: trimmed(2, 'Enter your city or area.', 80),
  street: trimmed(4, 'Enter the street and area details.', 160),
  building: trimmed(1, 'Enter the building name or number.', 80),
  floor: z.string().trim().max(20).optional().or(z.literal('')),
  landmark: z.string().trim().max(120).optional().or(z.literal('')),
  instructions: z.string().trim().max(300, 'Please keep instructions under 300 characters.').optional().or(z.literal('')),
};

const districtMatchesGovernorate = (data) => {
  const gov = GOVERNORATES.find((g) => g.id === data.governorate);
  return !gov || gov.districts.includes(data.district);
};

export const addressSchema = z
  .object({ label: z.string().trim().max(40).optional().or(z.literal('')), ...addressFields, isDefault: z.boolean().optional() })
  .refine(districtMatchesGovernorate, { message: 'Choose a district within the selected governorate.', path: ['district'] });

export const checkoutSchema = z
  .object({
    fullName: trimmed(3, 'Enter your full name.', 80).refine((v) => v.split(/\s+/).length >= 2, 'Please enter your first and last name.'),
    phone: phoneSchema,
    email: emailSchema,
    ...addressFields,
    paymentMethod: z.enum(['cod', 'manual'], { errorMap: () => ({ message: 'Choose a payment method.' }) }),
    saveAddress: z.boolean().optional(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Please confirm you have read the delivery and returns policy.' }) }),
  })
  .refine(districtMatchesGovernorate, { message: 'Choose a district within the selected governorate.', path: ['district'] });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

export const registerSchema = z
  .object({
    fullName: trimmed(3, 'Enter your full name.', 80),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    marketingOptIn: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

export const profileSchema = z.object({
  fullName: trimmed(3, 'Enter your full name.', 80),
  email: emailSchema,
  phone: phoneSchema,
  marketingOptIn: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] })
  .refine((d) => d.newPassword !== d.currentPassword, { message: 'Choose a password different from your current one.', path: ['newPassword'] });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const notifyMeSchema = z.object({ email: emailSchema });

export const newsletterSchema = z.object({ email: emailSchema });

export const trackOrderSchema = z.object({
  reference: z.string().trim().min(4, 'Enter your order number.').max(20),
  phone: phoneSchema,
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Choose a rating.').max(5),
  title: trimmed(3, 'Add a short title.', 80),
  body: trimmed(20, 'Tell us a little more (at least 20 characters).', 1200),
});

// Turns a ZodError into { field: message } for API error payloads.
export const zodFieldErrors = (error) =>
  Object.fromEntries(error.issues.map((i) => [i.path.join('.') || '_', i.message]));
