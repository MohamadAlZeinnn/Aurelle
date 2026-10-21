import { describe, expect, it } from 'vitest';
import { couponSchema, productSchema, shippingSettingsSchema } from '../lib/adminValidation.js';
import { products } from '../data/products.js';

// Form inputs arrive as strings; empty optional numbers must become null, not 0.
const asForm = (p) => ({
  ...p,
  subcategoryId: p.subcategoryId ?? '',
  variants: p.variants.map((v) => ({ ...v, price: String(v.price), stock: String(v.stock), compareAtPrice: v.compareAtPrice ?? '', costPrice: v.costPrice ?? '' })),
});

describe('admin product validation', () => {
  it('accepts every seed product as edited in the form', () => {
    for (const p of products) {
      const r = productSchema.safeParse(asForm(p));
      expect(r.success, `${p.slug}: ${JSON.stringify(r.error?.issues)}`).toBe(true);
    }
  });

  it('treats an empty compare-at price as not set', () => {
    const r = productSchema.parse(asForm(products.find((p) => p.id === 'p_lip_oil')));
    expect(r.variants[0].compareAtPrice).toBeNull();
    expect(r.variants[0].price).toBe(18);
  });

  it('rejects a compare-at price that is not above the selling price', () => {
    const p = asForm(products[0]);
    p.variants[0].compareAtPrice = '10';
    expect(productSchema.safeParse(p).success).toBe(false);
  });

  it('rejects duplicate SKUs and publishing without images', () => {
    const p = asForm(products.find((x) => x.variants.length > 1));
    p.variants[1].sku = p.variants[0].sku;
    expect(productSchema.safeParse(p).success).toBe(false);
    expect(productSchema.safeParse({ ...asForm(products[0]), images: [] }).success).toBe(false);
  });
});

describe('admin settings validation', () => {
  it('keeps an empty free-shipping threshold as null', () => {
    expect(shippingSettingsSchema.parse({ freeShippingThreshold: '', zones: [] }).freeShippingThreshold).toBeNull();
    expect(shippingSettingsSchema.parse({ freeShippingThreshold: '60', zones: [] }).freeShippingThreshold).toBe(60);
  });

  it('parses coupon limits', () => {
    const base = { code: 'test10', type: 'percent', value: '10', minSubtotal: '0', maxDiscount: '', categoryIds: [], startsAt: '2026-01-01', endsAt: '2026-12-31', usageLimit: '', perCustomerLimit: '1', isActive: true };
    const c = couponSchema.parse(base);
    expect(c.code).toBe('TEST10');
    expect(c.usageLimit).toBeNull();
    expect(c.perCustomerLimit).toBe(1);
    expect(couponSchema.safeParse({ ...base, endsAt: '2025-01-01' }).success).toBe(false);
  });
});
