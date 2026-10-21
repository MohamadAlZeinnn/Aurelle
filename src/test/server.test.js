// Integration tests for the demo REST server: the critical commerce journeys end to end.
import { beforeEach, describe, expect, it } from 'vitest';
import { handleRequest } from '../services/mock/server.js';
import { resetDb, getDb } from '../services/mock/db.js';

const call = (method, url, data, headers = {}) => handleRequest({ method, url, data, headers });
const customer = {
  fullName: 'Test Customer',
  phone: '03 555 666',
  email: 'test@example.com',
  governorate: 'beirut',
  district: 'Beirut',
  city: 'Gemmayze',
  street: 'Gouraud street',
  building: 'Bldg. 5',
  floor: '2',
  landmark: '',
  instructions: '',
  paymentMethod: 'cod',
  acceptTerms: true,
};

async function adminToken() {
  const { token } = await call('POST', '/auth/login', { email: 'admin@lumabeauty.demo', password: 'Admin2026!' });
  return { authorization: `Bearer ${token}` };
}

beforeEach(() => resetDb());

describe('catalogue', () => {
  it('filters, searches and paginates', async () => {
    const all = await call('GET', '/catalog/products?pageSize=100');
    expect(all.total).toBe(30); // drafts and archived are hidden
    const eye = await call('GET', '/catalog/products?category=eye-care');
    expect(eye.items.every((p) => p.category.slug === 'eye-care')).toBe(true);
    const sku = await call('GET', '/catalog/products?q=LUM-SER-HWS');
    expect(sku.items[0].slug).toBe('hyaluronic-water-serum');
    const inStock = await call('GET', '/catalog/products?inStock=true&pageSize=100');
    expect(inStock.items.some((p) => p.stockStatus === 'out_of_stock')).toBe(false);
    const sorted = await call('GET', '/catalog/products?sort=price-asc&pageSize=100');
    const prices = sorted.items.map((p) => p.priceMin);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('keeps sold-out products visible with a badge', async () => {
    const p = await call('GET', '/catalog/products/rose-quartz-hydrogel-eye-patches');
    expect(p.stockStatus).toBe('out_of_stock');
    expect(p.badges[0].label).toBe('Sold out');
    expect(p.costPrice).toBeUndefined();
    expect(p.variants[0].costPrice).toBeUndefined();
  });

  it('computes ratings only from approved reviews', async () => {
    const p = await call('GET', '/catalog/products/gold-peptide-hydrogel-eye-patches');
    expect(p.rating.count).toBe(4); // the pending 1-star review is excluded
    const noReviews = await call('GET', '/catalog/products/folding-vanity-mirror');
    expect(noReviews.rating).toEqual({ average: null, count: 0 });
  });
});

describe('cart quoting', () => {
  it('clamps to available stock and flags unavailable lines', async () => {
    const q = await call('POST', '/cart/quote', {
      items: [
        { productId: 'p_vitc_serum', variantId: 'v_vcs_30', quantity: 5 }, // 2 in stock
        { productId: 'p_rose_patches', variantId: 'v_rose_60', quantity: 1 }, // sold out
      ],
    });
    expect(q.items[0].status).toBe('adjusted');
    expect(q.items[0].available).toBe(2);
    expect(q.items[1].status).toBe('unavailable');
    expect(q.canCheckout).toBe(false);
    expect(q.subtotal).toBe(76);
  });

  it('reports invalid promo codes', async () => {
    const q = await call('POST', '/cart/quote', { items: [{ productId: 'p_gel_cream', variantId: 'v_hgc_50', quantity: 1 }], couponCode: 'NOPE' });
    expect(q.coupon.valid).toBe(false);
    expect(q.discount).toBe(0);
  });
});

describe('checkout', () => {
  it('places a guest COD order, decrements stock and audits it', async () => {
    const items = [{ productId: 'p_gel_cream', variantId: 'v_hgc_50', quantity: 2 }];
    const order = await call('POST', '/orders', { items, customer }, { 'idempotency-key': 'k1' });
    expect(order.reference).toMatch(/^LUMA-\d+$/);
    expect(order.status).toBe('pending');
    expect(order.paymentStatus).toBe('pending');
    expect(order.total).toBe(76); // free delivery over $60
    const db = getDb();
    expect(db.products.find((p) => p.id === 'p_gel_cream').variants[0].stock).toBe(25);
    expect(db.inventoryLog[0]).toMatchObject({ type: 'sale', delta: -2, before: 27, after: 25 });

    // Same idempotency key → same order, no second decrement.
    const again = await call('POST', '/orders', { items, customer }, { 'idempotency-key': 'k1' });
    expect(again.id).toBe(order.id);
    expect(db.products.find((p) => p.id === 'p_gel_cream').variants[0].stock).toBe(25);

    const tracked = await call('GET', `/orders/track?reference=${order.reference}&phone=03555666`);
    expect(tracked.id).toBe(order.id);
  });

  it('refuses to oversell and to accept invalid forms', async () => {
    await expect(call('POST', '/orders', { items: [{ productId: 'p_vitc_serum', variantId: 'v_vcs_30', quantity: 3 }], customer })).rejects.toMatchObject({ status: 409, code: 'STOCK_CHANGED' });
    await expect(call('POST', '/orders', { items: [{ productId: 'p_gel_cream', variantId: 'v_hgc_50', quantity: 1 }], customer: { ...customer, phone: '123' } })).rejects.toMatchObject({ status: 400 });
    await expect(
      call('POST', '/orders', { items: [{ productId: 'p_gel_cream', variantId: 'v_hgc_50', quantity: 1 }], customer, couponCode: 'SUMMER20' })
    ).rejects.toMatchObject({ status: 422, code: 'COUPON_INVALID' });
  });

  it('prevents the second of two concurrent orders for the last units', async () => {
    const items = [{ productId: 'p_vitc_serum', variantId: 'v_vcs_30', quantity: 2 }];
    const results = await Promise.allSettled([call('POST', '/orders', { items, customer }), call('POST', '/orders', { items, customer })]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(getDb().products.find((p) => p.id === 'p_vitc_serum').variants[0].stock).toBe(0);
  });
});

describe('admin', () => {
  it('rejects customers and anonymous users', async () => {
    await expect(call('GET', '/admin/dashboard')).rejects.toMatchObject({ status: 401 });
    const { token } = await call('POST', '/auth/login', { email: 'layla@example.com', password: 'Luma2026!' });
    await expect(call('GET', '/admin/dashboard', null, { authorization: `Bearer ${token}` })).rejects.toMatchObject({ status: 403 });
  });

  it('moves an order through fulfilment and restocks on cancel exactly once', async () => {
    const h = await adminToken();
    const order = await call('POST', '/orders', { items: [{ productId: 'p_gel_cream', variantId: 'v_hgc_50', quantity: 1 }], customer });
    const confirmed = await call('POST', `/admin/orders/${order.id}/status`, { status: 'confirmed' }, h);
    expect(confirmed.status).toBe('confirmed');
    await expect(call('POST', `/admin/orders/${order.id}/status`, { status: 'delivered' }, h)).rejects.toMatchObject({ status: 409 });
    await call('POST', `/admin/orders/${order.id}/cancel`, { reason: 'Customer request' }, h);
    expect(getDb().products.find((p) => p.id === 'p_gel_cream').variants[0].stock).toBe(27);
    await expect(call('POST', `/admin/orders/${order.id}/cancel`, {}, h)).rejects.toMatchObject({ status: 409 });
    expect(getDb().products.find((p) => p.id === 'p_gel_cream').variants[0].stock).toBe(27);
  });

  it('inventory changes are reflected on the storefront', async () => {
    const h = await adminToken();
    await call('POST', '/admin/inventory/adjustments', { productId: 'p_gel_cream', variantId: 'v_hgc_50', mode: 'set', quantity: 0, type: 'correction', note: 'Audit' }, h);
    let p = await call('GET', '/catalog/products/hydrating-gel-cream');
    expect(p.stockStatus).toBe('out_of_stock');
    await call('POST', '/admin/inventory/adjustments', { productId: 'p_rose_patches', variantId: 'v_rose_60', mode: 'add', quantity: 12, type: 'restock' }, h);
    p = await call('GET', '/catalog/products/rose-quartz-hydrogel-eye-patches');
    expect(p.stockStatus).toBe('in_stock');
    const requests = await call('GET', '/admin/restock-requests?status=ready', null, h);
    expect(requests.length).toBe(2);
  });

  it('dashboard aggregates orders', async () => {
    const h = await adminToken();
    const d = await call('GET', '/admin/dashboard?days=30', null, h);
    expect(d.kpis.pendingOrders).toBe(2);
    expect(d.series).toHaveLength(30);
    expect(d.inventoryWarnings.length).toBeGreaterThan(0);
  });
});
