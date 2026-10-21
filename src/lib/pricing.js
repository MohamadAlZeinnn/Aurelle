// Cart / order total calculation and coupon eligibility.
// The demo server runs exactly this code; a production backend must re-implement and
// enforce it server-side — client totals are only ever a preview.
import { fromCents, toCents } from './money.js';

export function evaluateCoupon(coupon, { subtotal, items = [], customerKey, usageByCustomer = 0, now = new Date() }) {
  if (!coupon) return { valid: false, message: 'This code is not recognised.' };
  if (!coupon.isActive) return { valid: false, message: 'This code is no longer active.' };
  const t = now.getTime();
  if (coupon.startsAt && t < new Date(coupon.startsAt).getTime()) return { valid: false, message: 'This code is not active yet.' };
  if (coupon.endsAt && t > new Date(coupon.endsAt).getTime()) return { valid: false, message: 'This code has expired.' };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'This code has reached its usage limit.' };
  if (customerKey && coupon.perCustomerLimit != null && usageByCustomer >= coupon.perCustomerLimit)
    return { valid: false, message: 'You have already used this code.' };

  const eligibleItems = coupon.categoryIds?.length ? items.filter((i) => coupon.categoryIds.includes(i.categoryId)) : items;
  const eligibleSubtotal = fromCents(eligibleItems.reduce((s, i) => s + toCents(i.unitPrice) * i.quantity, 0));
  if (coupon.categoryIds?.length && eligibleSubtotal <= 0)
    return { valid: false, message: 'This code does not apply to the items in your bag.' };
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal)
    return { valid: false, message: `Spend $${coupon.minSubtotal} or more to use this code.` };

  let discount = 0;
  if (coupon.type === 'percent') discount = fromCents(Math.round((toCents(eligibleSubtotal) * coupon.value) / 100));
  if (coupon.type === 'fixed') discount = Math.min(coupon.value, eligibleSubtotal);
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

  return {
    valid: true,
    discount,
    freeShipping: coupon.type === 'free_shipping',
    message: coupon.description || 'Code applied.',
  };
}

export function shippingForZone(settings, governorate) {
  const zone = settings?.shipping?.zones?.find((z) => z.governorate === governorate);
  if (!zone || zone.enabled === false) return null;
  return zone;
}

/**
 * @param {object} p
 * @param {{unitPrice:number, quantity:number, categoryId?:string}[]} p.items  purchasable lines only
 * @param {object} p.settings store settings (shipping config)
 * @param {string} [p.governorate]
 * @param {object} [p.couponResult] output of evaluateCoupon
 */
export function computeTotals({ items, settings, governorate, couponResult }) {
  const subtotalCents = items.reduce((s, i) => s + toCents(i.unitPrice) * i.quantity, 0);
  const subtotal = fromCents(subtotalCents);
  const discount = couponResult?.valid ? Math.min(couponResult.discount || 0, subtotal) : 0;
  const threshold = settings?.shipping?.freeShippingThreshold ?? null;
  const zone = governorate ? shippingForZone(settings, governorate) : null;
  const qualifiesFree = (threshold != null && subtotal - discount >= threshold) || Boolean(couponResult?.valid && couponResult.freeShipping);

  let shippingFee = null; // null = not yet known (no region chosen)
  if (zone) shippingFee = qualifiesFree ? 0 : zone.fee;
  else if (qualifiesFree && items.length) shippingFee = 0;

  const total = fromCents(subtotalCents - toCents(discount) + toCents(shippingFee ?? 0));
  return {
    subtotal,
    discount,
    shippingFee,
    total,
    freeShippingThreshold: threshold,
    amountToFreeShipping: threshold != null ? Math.max(0, fromCents(toCents(threshold) - (subtotalCents - toCents(discount)))) : null,
    qualifiesFreeShipping: qualifiesFree,
    shippingZone: zone ? { governorate: zone.governorate, fee: zone.fee, estimate: zone.estimate || '' } : null,
  };
}
