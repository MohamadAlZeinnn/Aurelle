// Schemas for admin forms. Shared with the demo server; a production API must apply
// equivalent validation AND role-based authorisation on every admin endpoint.
import { z } from 'zod';

const money = (msg) => z.coerce.number({ invalid_type_error: msg }).min(0, msg).max(100000);
// Empty inputs mean "not set" (null) — never coerce '' to 0.
const emptyToNull = (v) => (v === '' || v === undefined || v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : Number(v));
const optionalNumber = (schema) => z.preprocess(emptyToNull, schema.nullable());
const optionalMoney = optionalNumber(z.number({ invalid_type_error: 'Enter a number.' }).min(0, 'Cannot be negative.'));
const optionalCount = optionalNumber(z.number({ invalid_type_error: 'Enter a whole number.' }).int('Whole numbers only.').min(1, 'Must be at least 1.'));

export const variantSchema = z
  .object({
    id: z.string().optional(),
    sku: z.string().trim().min(3, 'SKU is required.').max(40).regex(/^[A-Z0-9-]+$/i, 'Use letters, numbers and dashes only.'),
    name: z.string().trim().min(1, 'Name the option, or use "Default".').max(60),
    price: money('Enter a valid price.').refine((v) => v > 0, 'Price must be greater than zero.'),
    compareAtPrice: optionalMoney,
    costPrice: optionalMoney,
    stock: z.coerce.number().int('Whole numbers only.').min(0, 'Stock cannot be negative.'),
    discontinued: z.boolean().optional().default(false),
    swatch: z.string().optional().or(z.literal('')),
    image: z.string().optional().or(z.literal('')),
  })
  .refine((v) => v.compareAtPrice == null || v.compareAtPrice > v.price, {
    message: 'Compare-at price must be higher than the selling price (or left empty).',
    path: ['compareAtPrice'],
  });

export const productSchema = z
  .object({
    name: z.string().trim().min(3, 'Enter a product name.').max(120),
    slug: z.string().trim().min(3, 'Enter a URL handle.').max(120).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only.'),
    brandId: z.string().min(1, 'Choose a brand.'),
    categoryId: z.string().min(1, 'Choose a category.'),
    subcategoryId: z.string().optional().or(z.literal('')),
    shortDescription: z.string().trim().max(200).optional().or(z.literal('')),
    description: z.string().trim().max(4000).optional().or(z.literal('')),
    benefits: z.array(z.string().trim().min(1)).default([]),
    keyIngredients: z.array(z.object({ name: z.string().trim().min(1, 'Required'), purpose: z.string().trim().optional().or(z.literal('')) })).default([]),
    directions: z.string().trim().max(2000).optional().or(z.literal('')),
    ingredients: z.string().trim().max(4000).optional().or(z.literal('')),
    specifications: z.array(z.object({ label: z.string().trim().min(1, 'Required'), value: z.string().trim().min(1, 'Required') })).default([]),
    faqs: z.array(z.object({ q: z.string().trim().min(1, 'Required'), a: z.string().trim().min(1, 'Required') })).default([]),
    concerns: z.array(z.string()).default([]),
    attributes: z.array(z.string()).default([]),
    images: z.array(z.string().min(1)).default([]),
    isNew: z.boolean().default(false),
    isBestseller: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    status: z.enum(['draft', 'published', 'archived']),
    lowStockThreshold: z.coerce.number().int().min(0).max(1000),
    variantLabel: z.string().trim().max(30).nullable().optional(),
    variants: z.array(variantSchema).min(1, 'Add at least one variant.'),
  })
  .superRefine((p, ctx) => {
    const skus = p.variants.map((v) => v.sku.toUpperCase());
    skus.forEach((sku, i) => {
      if (skus.indexOf(sku) !== i) ctx.addIssue({ code: 'custom', message: 'Duplicate SKU.', path: ['variants', i, 'sku'] });
    });
    if (p.status === 'published') {
      if (!p.images.length) ctx.addIssue({ code: 'custom', message: 'Add at least one image before publishing.', path: ['images'] });
      if (!p.description) ctx.addIssue({ code: 'custom', message: 'Add a description before publishing.', path: ['description'] });
    }
  });

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Enter a name.').max(60),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only.'),
  tagline: z.string().trim().max(160).optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
  subcategories: z
    .array(z.object({ id: z.string().optional(), name: z.string().trim().min(2, 'Required'), slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, 'Invalid handle') }))
    .default([]),
});

export const couponSchema = z
  .object({
    code: z.string().trim().min(3, 'At least 3 characters.').max(24).regex(/^[A-Z0-9]+$/i, 'Letters and numbers only.').transform((s) => s.toUpperCase()),
    description: z.string().trim().max(120).optional().or(z.literal('')),
    type: z.enum(['percent', 'fixed', 'free_shipping']),
    value: z.coerce.number().min(0),
    minSubtotal: z.coerce.number().min(0).default(0),
    maxDiscount: optionalMoney,
    categoryIds: z.array(z.string()).default([]),
    startsAt: z.string().min(1, 'Choose a start date.'),
    endsAt: z.string().min(1, 'Choose an end date.'),
    usageLimit: optionalCount,
    perCustomerLimit: optionalCount,
    isActive: z.boolean(),
  })
  .refine((c) => c.type !== 'percent' || (c.value > 0 && c.value <= 90), { message: 'Percent must be between 1 and 90.', path: ['value'] })
  .refine((c) => c.type !== 'fixed' || c.value > 0, { message: 'Enter an amount.', path: ['value'] })
  .refine((c) => new Date(c.endsAt) > new Date(c.startsAt), { message: 'End date must be after the start date.', path: ['endsAt'] });

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  mode: z.enum(['add', 'remove', 'set']),
  quantity: z.coerce.number().int('Whole numbers only.').min(0, 'Cannot be negative.'),
  type: z.enum(['restock', 'correction', 'damage', 'return']),
  note: z.string().trim().max(200).optional().or(z.literal('')),
});

export const shippingSettingsSchema = z.object({
  freeShippingThreshold: optionalMoney,
  zones: z.array(
    z.object({
      governorate: z.string(),
      fee: z.coerce.number().min(0, 'Fee cannot be negative.').max(100),
      estimate: z.string().trim().max(40).optional().or(z.literal('')),
      enabled: z.boolean(),
    })
  ),
});

export const storeSettingsSchema = z.object({
  store: z.object({
    name: z.string().trim().min(2).max(60),
    supportEmail: z.string().trim().email(),
    supportPhone: z.string().trim().max(30).optional().or(z.literal('')),
    whatsappNumber: z.string().trim().regex(/^\d*$/, 'Digits only, international format without +.').max(15),
    instagramUrl: z.string().trim().url().optional().or(z.literal('')),
    instagramHandle: z.string().trim().max(40).optional().or(z.literal('')),
    announcements: z.array(z.string().trim().min(1)).max(4),
    returnsPolicy: z.string().trim().max(1000),
    showLowStockCount: z.boolean(),
  }),
  payments: z.object({
    cod: z.object({ enabled: z.boolean(), label: z.string().trim().min(2), description: z.string().trim().max(300) }),
    manual: z.object({ enabled: z.boolean(), label: z.string().trim().min(2), description: z.string().trim().max(300) }),
  }),
});
