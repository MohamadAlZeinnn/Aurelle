import { z } from "zod";
import { siteConfig } from "@/data/site-config";
import { ALL_DISTRICTS, LEBANESE_MOBILE_PREFIXES } from "@/data/lebanon";

/**
 * Normalises a Lebanese phone number to E.164 (+961XXXXXXX[X]) or returns null.
 * Accepts +961 / 00961 / 961 / leading-0 national formats with spaces or dashes.
 * Mobile: 3XXXXXX, 70/71/76/78/79/81XXXXXX. Landline: 0[1,4-9]XXXXXX.
 */
export function normalizeLebanesePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("00961")) digits = digits.slice(5);
  else if (digits.startsWith("961")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);

  const isMobile =
    (digits.length === 7 && digits.startsWith("3")) ||
    (digits.length === 8 && LEBANESE_MOBILE_PREFIXES.some((p) => p.length === 2 && digits.startsWith(p)));
  const isLandline = digits.length === 7 && /^[1456789]/.test(digits);
  return isMobile || isLandline ? `+961${digits}` : null;
}

const email = () => z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address."));

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `Please enter your ${label}.`).max(max, `Your ${label} is too long.`);

export const checkoutSchema = z.object({
  fullName: requiredText("full name", 100).refine(
    (v) => v.split(/\s+/).length >= 2,
    "Please enter your first and last name.",
  ),
  email: email(),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .refine(
      (v) => normalizeLebanesePhone(v) !== null,
      "Please enter a valid Lebanese number, e.g. 03 123 456 or 71 123 456.",
    ),
  country: z.enum(siteConfig.shipping.countries as [string, ...string[]], "We currently deliver within Lebanon only."),
  city: z.string().refine((v) => ALL_DISTRICTS.includes(v), "Please choose your city or district."),
  area: requiredText("area", 80),
  street: requiredText("street address", 200),
  notes: z.string().trim().max(500, "Delivery notes must be under 500 characters.").optional(),
  paymentMethod: z.enum(["cod", "card"], "Please choose a payment method."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartLinesSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(80),
      variantId: z.string().max(80).optional(),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .min(1, "Your bag is empty.")
  .max(50);

export const orderRequestSchema = z.object({
  customer: checkoutSchema,
  lines: cartLinesSchema,
});

export const newsletterSchema = z.object({
  email: email(),
  consent: z.literal(true, "Please confirm you would like to receive our emails."),
});

export const contactSchema = z.object({
  name: requiredText("name", 100),
  email: email(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters).").max(3000),
});

/** Flattens zod issues into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
