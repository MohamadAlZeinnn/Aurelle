import { HttpError, notFound, paginate, validate } from '../http.js';
import { newId, resetDb } from '../db.js';
import { serializeOrder } from '../domain.js';
import { couponSchema, shippingSettingsSchema, storeSettingsSchema } from '../../../lib/adminValidation.js';
import { productStockStatus, variantStockStatus } from '../../../lib/inventory.js';
import { roundMoney } from '../../../lib/money.js';

const ADMIN = { auth: 'admin' };
const COUNTED = (o) => !['cancelled', 'returned'].includes(o.status);
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

export function registerAdminMiscRoutes(router) {
  router.get(
    '/admin/dashboard',
    ({ db, query }) => {
      const days = [7, 30, 90].includes(Number(query.days)) ? Number(query.days) : 30;
      const end = new Date();
      const start = new Date(end.getTime() - (days - 1) * 86400000);
      start.setUTCHours(0, 0, 0, 0);
      const prevStart = new Date(start.getTime() - days * 86400000);

      const inRange = db.orders.filter((o) => new Date(o.createdAt) >= start);
      const prevRange = db.orders.filter((o) => new Date(o.createdAt) >= prevStart && new Date(o.createdAt) < start);
      const sum = (list) => roundMoney(list.filter(COUNTED).reduce((s, o) => s + o.total, 0));

      const series = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start.getTime() + i * 86400000);
        const key = dayKey(d);
        const dayOrders = inRange.filter((o) => dayKey(o.createdAt) === key && COUNTED(o));
        series.push({ date: key, sales: roundMoney(dayOrders.reduce((s, o) => s + o.total, 0)), orders: dayOrders.length });
      }

      const productSales = {};
      inRange.filter(COUNTED).forEach((o) =>
        o.items.forEach((i) => {
          productSales[i.productId] ??= { productId: i.productId, name: i.name, image: i.image, units: 0, revenue: 0 };
          productSales[i.productId].units += i.quantity;
          productSales[i.productId].revenue = roundMoney(productSales[i.productId].revenue + i.lineTotal);
        })
      );

      const published = db.products.filter((p) => p.status === 'published');
      const variantRows = published.flatMap((p) => p.variants.map((v) => ({ p, v, status: variantStockStatus(v, p.lowStockThreshold) })));
      const warnings = variantRows
        .filter((r) => r.status === 'out_of_stock' || r.status === 'low_stock')
        .sort((a, b) => a.v.stock - b.v.stock)
        .map(({ p, v, status }) => ({
          productId: p.id,
          variantId: v.id,
          name: p.name,
          variantName: v.name,
          sku: v.sku,
          stock: v.stock,
          status,
          image: v.image || p.images[0],
          waitlist: db.restockRequests.filter((r) => r.variantId === v.id && r.status !== 'notified').length,
        }));

      return {
        days,
        kpis: {
          sales: sum(inRange),
          salesPrev: sum(prevRange),
          orders: inRange.filter(COUNTED).length,
          ordersPrev: prevRange.filter(COUNTED).length,
          averageOrder: inRange.filter(COUNTED).length ? roundMoney(sum(inRange) / inRange.filter(COUNTED).length) : 0,
          pendingOrders: db.orders.filter((o) => o.status === 'pending').length,
          inFulfilment: db.orders.filter((o) => ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status)).length,
          completedOrders: db.orders.filter((o) => o.status === 'delivered').length,
          productsInStock: published.filter((p) => productStockStatus(p) !== 'out_of_stock').length,
          lowStockVariants: variantRows.filter((r) => r.status === 'low_stock').length,
          soldOutProducts: published.filter((p) => productStockStatus(p) === 'out_of_stock').length,
          restockRequests: db.restockRequests.filter((r) => r.status !== 'notified').length,
          pendingReviews: db.reviews.filter((r) => r.status === 'pending').length,
        },
        series,
        statusBreakdown: Object.entries(
          db.orders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
          }, {})
        ).map(([status, count]) => ({ status, count })),
        topProducts: Object.values(productSales).sort((a, b) => b.units - a.units).slice(0, 5),
        recentOrders: db.orders.slice(0, 6).map((o) => serializeOrder(o, { admin: true })),
        inventoryWarnings: warnings.slice(0, 8),
      };
    },
    ADMIN
  );

  // ───────────── coupons
  router.get('/admin/coupons', ({ db }) => db.coupons, ADMIN);
  router.post(
    '/admin/coupons',
    ({ db, body }) => {
      const data = validate(couponSchema, body);
      if (db.coupons.some((c) => c.code === data.code)) throw new HttpError(409, 'A coupon with this code already exists.', { errors: { code: 'Already exists.' } });
      const coupon = { id: newId('cp'), ...data, usedCount: 0 };
      db.coupons.unshift(coupon);
      return coupon;
    },
    ADMIN
  );
  router.put(
    '/admin/coupons/:id',
    ({ db, body, params }) => {
      const coupon = db.coupons.find((c) => c.id === params.id);
      if (!coupon) throw notFound('Coupon');
      const data = validate(couponSchema, body);
      if (db.coupons.some((c) => c.code === data.code && c.id !== coupon.id)) throw new HttpError(409, 'A coupon with this code already exists.', { errors: { code: 'Already exists.' } });
      Object.assign(coupon, data);
      return coupon;
    },
    ADMIN
  );
  router.delete(
    '/admin/coupons/:id',
    ({ db, params }) => {
      const coupon = db.coupons.find((c) => c.id === params.id);
      if (!coupon) throw notFound('Coupon');
      if (coupon.usedCount > 0) throw new HttpError(409, 'This code has been used on orders. Deactivate it instead to keep reporting accurate.');
      db.coupons = db.coupons.filter((c) => c.id !== params.id);
      return { ok: true };
    },
    ADMIN
  );

  // ───────────── customers (accounts + guest buyers grouped by phone)
  const customerIndex = (db) => {
    const map = new Map();
    for (const u of db.users.filter((x) => x.role === 'customer')) {
      map.set(u.phone, { key: u.id, accountId: u.id, fullName: u.fullName, email: u.email, phone: u.phone, createdAt: u.createdAt, marketingOptIn: u.marketingOptIn, type: 'account', orders: [] });
    }
    for (const o of db.orders) {
      const k = o.customer.phone;
      if (!map.has(k)) map.set(k, { key: `guest-${k.replace('+', '')}`, accountId: null, fullName: o.customer.fullName, email: o.customer.email, phone: k, createdAt: o.createdAt, type: 'guest', orders: [] });
      map.get(k).orders.push(o);
    }
    return [...map.values()].map((c) => {
      const counted = c.orders.filter(COUNTED);
      return {
        ...c,
        orderCount: c.orders.length,
        totalSpent: roundMoney(counted.reduce((s, o) => s + o.total, 0)),
        lastOrderAt: c.orders.map((o) => o.createdAt).sort().pop() ?? null,
        orders: undefined,
        _orders: c.orders,
      };
    });
  };

  router.get(
    '/admin/customers',
    ({ db, query }) => {
      let rows = customerIndex(db);
      if (query.q) {
        const q = query.q.toLowerCase();
        rows = rows.filter((c) => c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q.replace(/^0/, '')));
      }
      if (query.type) rows = rows.filter((c) => c.type === query.type);
      const sorters = { spent: (a, b) => b.totalSpent - a.totalSpent, recent: (a, b) => (b.lastOrderAt || '').localeCompare(a.lastOrderAt || ''), name: (a, b) => a.fullName.localeCompare(b.fullName) };
      rows.sort(sorters[query.sort] || sorters.recent);
      return paginate(rows.map(({ _orders, ...c }) => c), query.page, query.pageSize || 20);
    },
    ADMIN
  );

  router.get(
    '/admin/customers/:key',
    ({ db, params }) => {
      const c = customerIndex(db).find((x) => x.key === params.key);
      if (!c) throw notFound('Customer');
      const user = c.accountId ? db.users.find((u) => u.id === c.accountId) : null;
      const { _orders, ...rest } = c;
      return { ...rest, addresses: user?.addresses ?? [], orders: _orders.map((o) => serializeOrder(o, { admin: true })) };
    },
    ADMIN
  );

  // ───────────── content
  router.get('/admin/content', ({ db }) => db.content, ADMIN);
  router.put(
    '/admin/content',
    ({ db, body }) => {
      const { hero, promoBanners, featuredCollections } = body || {};
      if (hero) {
        if (!hero.title?.trim()) throw new HttpError(400, 'The hero needs a headline.', { errors: { 'hero.title': 'Required' } });
        db.content.hero = { ...db.content.hero, ...hero };
      }
      if (Array.isArray(promoBanners)) db.content.promoBanners = promoBanners.map((b) => ({ ...b, id: b.id || newId('bn') }));
      if (Array.isArray(featuredCollections)) {
        for (const c of featuredCollections) {
          const missing = c.productIds.find((id) => !db.products.some((p) => p.id === id));
          if (missing) throw new HttpError(400, 'A featured collection references a product that no longer exists.');
        }
        db.content.featuredCollections = featuredCollections;
      }
      return db.content;
    },
    ADMIN
  );

  // ───────────── restock requests
  router.get(
    '/admin/restock-requests',
    ({ db, query }) => {
      let rows = db.restockRequests.map((r) => {
        const p = db.products.find((x) => x.id === r.productId);
        const v = p?.variants.find((x) => x.id === r.variantId);
        return { ...r, productName: p?.name ?? 'Deleted product', variantName: v?.name ?? '', sku: v?.sku ?? '', stock: v?.stock ?? 0, image: v?.image || p?.images[0] };
      });
      if (query.status) rows = rows.filter((r) => r.status === query.status);
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    ADMIN
  );
  router.post(
    '/admin/restock-requests/notify',
    ({ db, body }) => {
      // Demo: marks as notified. Production: enqueue emails via a provider (e.g. SendGrid) and mark on success.
      const ids = body?.ids ?? [];
      let count = 0;
      db.restockRequests.forEach((r) => {
        if (ids.includes(r.id) && r.status === 'ready') {
          r.status = 'notified';
          r.notifiedAt = new Date().toISOString();
          count++;
        }
      });
      if (!count) throw new HttpError(409, 'Only requests for items that are back in stock can be notified.');
      return { notified: count };
    },
    ADMIN
  );
  router.delete(
    '/admin/restock-requests/:id',
    ({ db, params }) => {
      db.restockRequests = db.restockRequests.filter((r) => r.id !== params.id);
      return { ok: true };
    },
    ADMIN
  );

  // ───────────── reviews
  router.get(
    '/admin/reviews',
    ({ db, query }) => {
      let rows = db.reviews.map((r) => ({ ...r, productName: db.products.find((p) => p.id === r.productId)?.name ?? 'Deleted product' }));
      if (query.status) rows = rows.filter((r) => r.status === query.status);
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { ...paginate(rows, query.page, query.pageSize || 20), counts: { pending: db.reviews.filter((r) => r.status === 'pending').length } };
    },
    ADMIN
  );
  router.patch(
    '/admin/reviews/:id',
    ({ db, params, body }) => {
      const review = db.reviews.find((r) => r.id === params.id);
      if (!review) throw notFound('Review');
      if (!['approved', 'rejected', 'pending'].includes(body?.status)) throw new HttpError(400, 'Unknown status.');
      review.status = body.status;
      return review;
    },
    ADMIN
  );
  router.delete(
    '/admin/reviews/:id',
    ({ db, params }) => {
      db.reviews = db.reviews.filter((r) => r.id !== params.id);
      return { ok: true };
    },
    ADMIN
  );

  // ───────────── settings
  router.get('/admin/settings', ({ db }) => db.settings, ADMIN);
  router.put(
    '/admin/settings/shipping',
    ({ db, body }) => {
      db.settings.shipping = validate(shippingSettingsSchema, body);
      return db.settings;
    },
    ADMIN
  );
  router.put(
    '/admin/settings/store',
    ({ db, body }) => {
      const data = validate(storeSettingsSchema, body);
      if (!data.payments.cod.enabled && !data.payments.manual.enabled) throw new HttpError(400, 'Keep at least one payment method enabled.');
      db.settings.store = data.store;
      db.settings.payments = data.payments;
      return db.settings;
    },
    ADMIN
  );

  router.get('/admin/newsletter', ({ db }) => db.newsletter, ADMIN);

  // Demo utility only — never expose in production.
  router.post('/demo/reset', () => {
    resetDb();
    return { ok: true };
  });
}
