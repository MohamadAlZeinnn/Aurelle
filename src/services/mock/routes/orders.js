import { HttpError, notFound, validate } from '../http.js';
import { newId } from '../db.js';
import { adjustStock, nextOrderReference, quoteCart, restoreOrderInventory, serializeOrder } from '../domain.js';
import { checkoutSchema, trackOrderSchema } from '../../../lib/validation.js';
import { normalizeLebanesePhone } from '../../../lib/phone.js';
import { CANCELLABLE_STATUSES } from '../../../constants/orders.js';

export function registerOrderRoutes(router) {
  router.post('/cart/quote', ({ db, body, user }) =>
    quoteCart(db, {
      items: body?.items ?? [],
      couponCode: body?.couponCode,
      governorate: body?.governorate,
      customerKey: user ? { email: user.email, phone: user.phone } : body?.customerEmail ? { email: body.customerEmail, phone: null } : null,
    })
  );

  /**
   * Place an order. In production this MUST run in a single DB transaction that:
   *  1. re-validates every line against current stock (row-level locks / optimistic concurrency),
   *  2. recomputes prices, discount and shipping server-side,
   *  3. decrements stock and writes audit rows,
   *  4. increments coupon usage,
   *  5. stores the idempotency key so retries return the same order.
   */
  router.post('/orders', ({ db, body, headers, user }) => {
    const key = headers['idempotency-key'];
    if (key && db.idempotency[key]) {
      const existing = db.orders.find((o) => o.id === db.idempotency[key]);
      if (existing) return serializeOrder(existing);
    }
    const data = validate(checkoutSchema, body?.customer);
    const payments = db.settings.payments;
    if (!payments[data.paymentMethod]?.enabled) throw new HttpError(422, 'This payment method is not available.', { code: 'PAYMENT_UNAVAILABLE' });
    const zone = db.settings.shipping.zones.find((z) => z.governorate === data.governorate);
    if (!zone || zone.enabled === false) throw new HttpError(422, 'We do not currently deliver to this governorate.', { code: 'NO_DELIVERY', errors: { governorate: 'Delivery is not available here yet.' } });

    const phone = normalizeLebanesePhone(data.phone);
    const quote = quoteCart(db, {
      items: body?.items ?? [],
      couponCode: body?.couponCode,
      governorate: data.governorate,
      customerKey: { email: data.email.toLowerCase(), phone },
    });
    if (!quote.items.length) throw new HttpError(422, 'Your bag is empty.', { code: 'EMPTY_CART' });
    if (!quote.canCheckout)
      throw new HttpError(409, 'Some items in your bag have changed availability. Please review your bag.', { code: 'STOCK_CHANGED', details: quote.issues });
    if (body?.couponCode && !quote.coupon?.valid)
      throw new HttpError(422, quote.coupon?.message || 'This code cannot be applied.', { code: 'COUPON_INVALID', errors: { couponCode: quote.coupon?.message } });
    if (body?.expectedTotal != null && Math.abs(Number(body.expectedTotal) - quote.total) > 0.009)
      throw new HttpError(409, 'Your order total has changed. Please review the updated total before placing your order.', { code: 'TOTAL_CHANGED', details: { total: quote.total } });

    const reference = nextOrderReference(db);
    const now = new Date().toISOString();

    // Allocate inventory (synchronous → atomic within the demo's single JS thread).
    for (const line of quote.items) {
      adjustStock(db, { productId: line.productId, variantId: line.variantId, delta: -line.billableQuantity, type: 'sale', note: `Order ${reference}`, by: 'Checkout', orderRef: reference });
      const product = db.products.find((p) => p.id === line.productId);
      product.salesCount = (product.salesCount || 0) + line.billableQuantity;
    }
    if (quote.coupon?.valid) {
      const c = db.coupons.find((x) => x.code === quote.coupon.code);
      if (c) c.usedCount += 1;
    }

    const order = {
      id: newId('ord'),
      reference,
      createdAt: now,
      updatedAt: now,
      customerId: user?.id ?? null,
      customer: { fullName: data.fullName, phone, email: data.email.toLowerCase() },
      shippingAddress: {
        governorate: data.governorate,
        district: data.district,
        city: data.city,
        street: data.street,
        building: data.building,
        floor: data.floor || '',
        landmark: data.landmark || '',
        instructions: data.instructions || '',
      },
      items: quote.items.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        name: l.name,
        variantName: l.variantName,
        sku: l.sku,
        image: l.image,
        categoryId: l.categoryId,
        unitPrice: l.unitPrice,
        quantity: l.billableQuantity,
        lineTotal: l.lineTotal,
      })),
      couponCode: quote.coupon?.valid ? quote.coupon.code : null,
      subtotal: quote.subtotal,
      discount: quote.discount,
      shippingFee: quote.shippingFee ?? 0,
      total: quote.total,
      shippingZone: quote.shippingZone,
      currency: 'USD',
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      history: [{ status: 'pending', at: now, note: 'Order placed online.', by: 'Customer' }],
      notes: [],
      refunds: [],
      inventoryRestored: false,
      source: 'web',
    };
    db.orders.unshift(order);
    if (key) db.idempotency[key] = order.id;

    if (user && data.saveAddress) {
      const u = db.users.find((x) => x.id === user.id);
      const exists = u.addresses.some((a) => a.street === order.shippingAddress.street && a.building === order.shippingAddress.building);
      if (!exists) u.addresses.push({ id: newId('ad'), label: 'Saved at checkout', ...order.shippingAddress, isDefault: u.addresses.length === 0 });
    }
    return serializeOrder(order);
  });

  // Guest order lookup: reference + the phone used at checkout.
  router.get('/orders/track', ({ db, query }) => {
    const { reference, phone } = validate(trackOrderSchema, query);
    const normalized = normalizeLebanesePhone(phone);
    const order = db.orders.find((o) => o.reference.toUpperCase() === reference.trim().toUpperCase() && o.customer.phone === normalized);
    if (!order) throw new HttpError(404, 'We could not find an order with that number and phone. Please check both and try again.', { code: 'NOT_FOUND' });
    return serializeOrder(order);
  });

  router.get('/account/orders', ({ db, user }) => db.orders.filter((o) => o.customerId === user.id).map((o) => serializeOrder(o)), { auth: 'user' });

  router.get(
    '/account/orders/:reference',
    ({ db, user, params }) => {
      const order = db.orders.find((o) => o.reference === params.reference && o.customerId === user.id);
      if (!order) throw notFound('Order');
      return serializeOrder(order);
    },
    { auth: 'user' }
  );

  // Customers may cancel their own order while it is still pending.
  router.post(
    '/account/orders/:reference/cancel',
    ({ db, user, params }) => {
      const order = db.orders.find((o) => o.reference === params.reference && o.customerId === user.id);
      if (!order) throw notFound('Order');
      if (order.status !== 'pending') throw new HttpError(409, 'This order is already being prepared. Please contact us to make changes.');
      if (!CANCELLABLE_STATUSES.includes(order.status)) throw new HttpError(409, 'This order can no longer be cancelled.');
      restoreOrderInventory(db, order, { by: user.fullName, reason: 'Cancelled by customer' });
      const now = new Date().toISOString();
      order.status = 'cancelled';
      order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : 'voided';
      order.updatedAt = now;
      order.history.push({ status: 'cancelled', at: now, note: 'Cancelled by customer.', by: 'Customer' });
      return serializeOrder(order);
    },
    { auth: 'user' }
  );
}
