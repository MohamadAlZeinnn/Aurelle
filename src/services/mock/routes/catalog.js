import { HttpError, notFound, paginate, validate } from '../http.js';
import { newId } from '../db.js';
import { publishedProducts, serializeProduct } from '../domain.js';
import { productStockStatus } from '../../../lib/inventory.js';
import { notifyMeSchema, newsletterSchema, reviewSchema } from '../../../lib/validation.js';
import { PAGE_SIZE } from '../../../constants/catalog.js';

const list = (v) => (Array.isArray(v) ? v : v ? String(v).split(',') : []).filter(Boolean);

function matchesSearch(db, p, q) {
  const needle = q.toLowerCase().trim();
  if (!needle) return true;
  const category = db.categories.find((c) => c.id === p.categoryId);
  const brand = db.brands.find((b) => b.id === p.brandId);
  const haystack = [p.name, p.shortDescription, p.description, category?.name, brand?.name, ...p.variants.map((v) => v.sku), ...p.concerns]
    .join(' ')
    .toLowerCase();
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

function applyFilters(db, products, f, skip) {
  return products.filter((p) => {
    if (f.q && !matchesSearch(db, p, f.q)) return false;
    if (skip !== 'category' && f.category) {
      const cat = db.categories.find((c) => c.slug === f.category);
      if (!cat || p.categoryId !== cat.id) return false;
    }
    if (skip !== 'subcategory' && f.subcategory.length) {
      const subIds = db.categories.flatMap((c) => c.subcategories).filter((s) => f.subcategory.includes(s.slug)).map((s) => s.id);
      if (!subIds.includes(p.subcategoryId)) return false;
    }
    if (skip !== 'brand' && f.brand.length) {
      const ids = db.brands.filter((b) => f.brand.includes(b.slug)).map((b) => b.id);
      if (!ids.includes(p.brandId)) return false;
    }
    if (skip !== 'concern' && f.concern.length && !f.concern.some((c) => p.concerns.includes(c))) return false;
    if (skip !== 'attribute' && f.attribute.length && !f.attribute.every((a) => p.attributes.includes(a))) return false;
    const minPrice = Math.min(...p.variants.map((v) => v.price));
    if (f.minPrice != null && minPrice < f.minPrice) return false;
    if (f.maxPrice != null && minPrice > f.maxPrice) return false;
    if (f.inStock && productStockStatus(p) === 'out_of_stock') return false;
    if (f.onSale && !p.variants.some((v) => v.compareAtPrice > v.price)) return false;
    if (f.isNew && !p.isNew) return false;
    if (f.bestseller && !p.isBestseller) return false;
    return true;
  });
}

const sorters = {
  featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.salesCount - a.salesCount,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  popular: (a, b) => b.salesCount - a.salesCount,
  'price-asc': (a, b) => a.priceMin - b.priceMin,
  'price-desc': (a, b) => b.priceMin - a.priceMin,
  rating: (a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0) || b.rating.count - a.rating.count,
};

const countBy = (items, keyFn) => {
  const out = {};
  for (const it of items) for (const k of [].concat(keyFn(it))) out[k] = (out[k] || 0) + 1;
  return out;
};

export function registerCatalogRoutes(router) {
  router.get('/catalog/products', ({ db, query }) => {
    const f = {
      q: query.q || '',
      category: query.category || '',
      subcategory: list(query.subcategory),
      brand: list(query.brand),
      concern: list(query.concern),
      attribute: list(query.attribute),
      minPrice: query.minPrice !== undefined && query.minPrice !== '' ? Number(query.minPrice) : null,
      maxPrice: query.maxPrice !== undefined && query.maxPrice !== '' ? Number(query.maxPrice) : null,
      inStock: query.inStock === 'true' || query.inStock === true,
      onSale: query.onSale === 'true',
      isNew: query.isNew === 'true',
      bestseller: query.bestseller === 'true',
    };
    const base = publishedProducts(db);
    const results = applyFilters(db, base, f).map((p) => serializeProduct(db, p));
    // Keep the raw sales count available for sorting only.
    const sales = Object.fromEntries(base.map((p) => [p.id, p.salesCount]));
    const sorter = sorters[query.sort] || sorters.featured;
    results.sort((a, b) => sorter({ ...a, salesCount: sales[a.id] }, { ...b, salesCount: sales[b.id] }));

    const facets = {
      brand: countBy(applyFilters(db, base, f, 'brand'), (p) => db.brands.find((b) => b.id === p.brandId)?.slug),
      concern: countBy(applyFilters(db, base, f, 'concern'), (p) => p.concerns),
      attribute: countBy(applyFilters(db, base, f, 'attribute'), (p) => p.attributes),
      subcategory: countBy(applyFilters(db, base, f, 'subcategory'), (p) => db.categories.flatMap((c) => c.subcategories).find((s) => s.id === p.subcategoryId)?.slug),
      category: countBy(applyFilters(db, base, f, 'category'), (p) => db.categories.find((c) => c.id === p.categoryId)?.slug),
    };
    const prices = base.flatMap((p) => p.variants.map((v) => v.price));
    return {
      ...paginate(results, query.page, query.pageSize || PAGE_SIZE),
      facets,
      priceBounds: { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) },
    };
  });

  router.get('/catalog/products/by-ids', ({ db, query }) => {
    const ids = list(query.ids);
    return ids
      .map((id) => db.products.find((p) => p.id === id && p.status === 'published'))
      .filter(Boolean)
      .map((p) => serializeProduct(db, p));
  });

  router.get('/catalog/products/:slug', ({ db, params }) => {
    const p = db.products.find((x) => x.slug === params.slug && x.status === 'published');
    if (!p) throw notFound('Product');
    return serializeProduct(db, p);
  });

  router.get('/catalog/products/:slug/related', ({ db, params }) => {
    const p = db.products.find((x) => x.slug === params.slug);
    if (!p) throw notFound('Product');
    const score = (o) => (o.categoryId === p.categoryId ? 3 : 0) + o.concerns.filter((c) => p.concerns.includes(c)).length + (o.brandId === p.brandId ? 1 : 0);
    return publishedProducts(db)
      .filter((o) => o.id !== p.id)
      .sort((a, b) => score(b) - score(a) || b.salesCount - a.salesCount)
      .slice(0, 4)
      .map((o) => serializeProduct(db, o));
  });

  router.get('/catalog/products/:id/reviews', ({ db, params }) => {
    const p = db.products.find((x) => x.id === params.id || x.slug === params.id);
    if (!p) throw notFound('Product');
    const items = db.reviews.filter((r) => r.productId === p.id && r.status === 'approved').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: items.filter((r) => r.rating === star).length }));
    return { items, distribution };
  });

  router.post(
    '/catalog/products/:id/reviews',
    ({ db, params, body, user }) => {
      const p = db.products.find((x) => x.id === params.id);
      if (!p) throw notFound('Product');
      const data = validate(reviewSchema, body);
      const purchased = db.orders.some((o) => o.customerId === user.id && o.status === 'delivered' && o.items.some((i) => i.productId === p.id));
      const [first, last = ''] = user.fullName.split(' ');
      const review = {
        id: newId('rv'),
        productId: p.id,
        author: `${first} ${last ? `${last[0]}.` : ''}`.trim(),
        ...data,
        createdAt: new Date().toISOString(),
        verifiedPurchase: purchased,
        status: 'pending',
        userId: user.id,
      };
      db.reviews.unshift(review);
      return review;
    },
    { auth: 'user' }
  );

  router.get('/catalog/categories', ({ db }) =>
    db.categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ ...c, productCount: publishedProducts(db).filter((p) => p.categoryId === c.id).length }))
  );

  router.get('/catalog/filters', ({ db }) => ({ brands: db.brands, concerns: db.concerns, attributes: db.attributes }));

  router.get('/catalog/home', ({ db }) => {
    const pub = publishedProducts(db);
    const ser = (p) => serializeProduct(db, p);
    const byIds = (ids) => ids.map((id) => pub.find((p) => p.id === id)).filter(Boolean).map(ser);
    const reviews = db.reviews
      .filter((r) => r.status === 'approved' && r.rating >= 4 && r.body.length > 60)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6)
      .map((r) => ({ ...r, product: (({ name, slug }) => ({ name, slug }))(db.products.find((p) => p.id === r.productId)) }));
    return {
      hero: db.content.hero,
      promoBanners: db.content.promoBanners.filter((b) => b.isActive),
      featuredCollections: db.content.featuredCollections.filter((c) => c.isActive).map((c) => ({ ...c, products: byIds(c.productIds) })),
      bestSellers: pub.filter((p) => p.isBestseller).sort((a, b) => b.salesCount - a.salesCount).slice(0, 8).map(ser),
      newArrivals: pub.filter((p) => p.isNew).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map(ser),
      reviews,
      gallery: db.content.gallery,
    };
  });

  router.post('/restock-requests', ({ db, body }) => {
    const { email } = validate(notifyMeSchema, body);
    const product = db.products.find((p) => p.id === body.productId);
    const variant = product?.variants.find((v) => v.id === body.variantId);
    if (!variant) throw notFound('Product');
    if (variant.discontinued) throw new HttpError(409, 'This option has been discontinued and will not be restocked.');
    const existing = db.restockRequests.find((r) => r.variantId === variant.id && r.email.toLowerCase() === email.toLowerCase() && r.status !== 'notified');
    if (!existing) db.restockRequests.unshift({ id: newId('rs'), productId: product.id, variantId: variant.id, email, createdAt: new Date().toISOString(), status: variant.stock > 0 ? 'ready' : 'waiting' });
    return { ok: true, alreadyRequested: Boolean(existing) };
  });

  router.post('/newsletter', ({ db, body }) => {
    const { email } = validate(newsletterSchema, body);
    const exists = db.newsletter.some((n) => n.email.toLowerCase() === email.toLowerCase());
    if (!exists) db.newsletter.push({ email, createdAt: new Date().toISOString() });
    return { ok: true, alreadySubscribed: exists };
  });

  router.get('/store/settings', ({ db }) => {
    const { store, shipping, payments } = db.settings;
    return {
      store,
      shipping,
      payments: Object.fromEntries(Object.entries(payments).filter(([, m]) => m.enabled)),
    };
  });
}
