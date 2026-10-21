import { describe, expect, it } from 'vitest';
import { normalizeLebanesePhone, formatLebanesePhone } from '../lib/phone.js';
import { variantStockStatus, productStockStatus, lowStockMessage } from '../lib/inventory.js';
import { computeTotals, evaluateCoupon } from '../lib/pricing.js';
import { checkoutSchema } from '../lib/validation.js';
import { settings, coupons } from '../data/store.js';
import { products } from '../data/products.js';

describe('Lebanese phone numbers', () => {
  it.each([
    ['03 123 456', '+9613123456'],
    ['70-123456', '+96170123456'],
    ['+961 71 123 456', '+96171123456'],
    ['00961 81 222 333', '+96181222333'],
    ['76123456', '+96176123456'],
  ])('normalises %s', (input, expected) => expect(normalizeLebanesePhone(input)).toBe(expected));

  it.each(['01 234 567', '03 12345', '72 123 456', '+33 6 12 34 56 78', 'abc'])('rejects %s', (input) => expect(normalizeLebanesePhone(input)).toBeNull());

  it('formats for display', () => expect(formatLebanesePhone('+96170123456')).toBe('+961 70 123 456'));
});

describe('inventory states', () => {
  it('classifies variants', () => {
    expect(variantStockStatus({ stock: 0 })).toBe('out_of_stock');
    expect(variantStockStatus({ stock: 3 }, 5)).toBe('low_stock');
    expect(variantStockStatus({ stock: 30 }, 5)).toBe('in_stock');
    expect(variantStockStatus({ stock: 30, discontinued: true })).toBe('discontinued');
  });

  it('seed data covers in-stock, low-stock and sold-out products', () => {
    const statuses = products.filter((p) => p.status === 'published').map(productStockStatus);
    expect(statuses).toContain('in_stock');
    expect(statuses).toContain('low_stock');
    expect(statuses).toContain('out_of_stock');
    expect(products.filter((p) => p.status === 'published').length).toBeGreaterThanOrEqual(24);
  });

  it('only shows truthful low-stock copy', () => {
    expect(lowStockMessage({ stock: 2 }, 5)).toBe('Only 2 left in stock');
    expect(lowStockMessage({ stock: 20 }, 5)).toBeNull();
    expect(lowStockMessage({ stock: 0 }, 5)).toBeNull();
  });
});

describe('pricing', () => {
  const items = [{ unitPrice: 24, quantity: 2, categoryId: 'cat_eye' }, { unitPrice: 12.5, quantity: 1, categoryId: 'cat_lip' }];
  const welcome = coupons.find((c) => c.code === 'WELCOME10');
  const now = new Date('2026-10-20T12:00:00Z');

  it('charges zone shipping under the free threshold', () => {
    const t = computeTotals({ items, settings, governorate: 'beirut' });
    expect(t.subtotal).toBe(60.5);
    expect(t.shippingFee).toBe(0); // 60.5 ≥ 60 threshold
    const small = computeTotals({ items: [items[1]], settings, governorate: 'akkar' });
    expect(small.shippingFee).toBe(6);
    expect(small.total).toBe(18.5);
    expect(small.amountToFreeShipping).toBe(47.5);
  });

  it('applies a percentage coupon with eligibility rules', () => {
    const res = evaluateCoupon(welcome, { subtotal: 60.5, items, now });
    expect(res.valid).toBe(true);
    expect(res.discount).toBe(6.05);
    const t = computeTotals({ items, settings, governorate: 'beirut', couponResult: res });
    // After discount the subtotal drops below the free-delivery threshold.
    expect(t.shippingFee).toBe(3);
    expect(t.total).toBe(57.45);
  });

  it('rejects expired, exhausted and below-minimum coupons', () => {
    expect(evaluateCoupon(coupons.find((c) => c.code === 'SUMMER20'), { subtotal: 100, items, now }).message).toMatch(/expired/);
    expect(evaluateCoupon(coupons.find((c) => c.code === 'VIP15'), { subtotal: 100, items, now }).message).toMatch(/limit/);
    expect(evaluateCoupon(welcome, { subtotal: 20, items: [items[1]], now }).valid).toBe(false);
    expect(evaluateCoupon(undefined, { subtotal: 20, items, now }).valid).toBe(false);
  });

  it('restricts category coupons to eligible lines', () => {
    const eye = coupons.find((c) => c.code === 'EYECARE5');
    expect(evaluateCoupon(eye, { subtotal: 30, items: [{ unitPrice: 30, quantity: 1, categoryId: 'cat_lip' }], now }).valid).toBe(false);
    expect(evaluateCoupon(eye, { subtotal: 48, items: [items[0]], now }).discount).toBe(5);
  });
});

describe('checkout validation', () => {
  const valid = {
    fullName: 'Layla Haddad',
    phone: '71 234 567',
    email: 'layla@example.com',
    governorate: 'beirut',
    district: 'Beirut',
    city: 'Achrafieh',
    street: 'Rue Sursock',
    building: 'Bldg. Nour',
    paymentMethod: 'cod',
    acceptTerms: true,
  };
  it('accepts a complete Lebanese address', () => expect(checkoutSchema.safeParse(valid).success).toBe(true));
  it('rejects mismatched district and bad phone', () => {
    const r = checkoutSchema.safeParse({ ...valid, district: 'Tripoli', phone: '12345' });
    expect(r.success).toBe(false);
    const paths = r.error.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('phone');
  });
});
