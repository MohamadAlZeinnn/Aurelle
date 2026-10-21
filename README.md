# LUMA Beauty — storefront & admin

A mobile-first beauty boutique for Lebanon: customer storefront, cart, cash-on-delivery checkout, accounts, order tracking, and a complete admin (products, variant inventory, orders, coupons, customers, content, reviews, restock requests, shipping and store settings).

React 18 · Vite 5 · JavaScript/JSX (no TypeScript) · Tailwind CSS 3 · React Router 6 · Zustand · TanStack Query 5 · Axios · React Hook Form + Zod · Framer Motion · Lucide.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — defaults run the demo
npm run dev                    # http://localhost:5173
npm test                       # 38 unit + integration tests (Vitest)
npm run build && npm run preview
```

Node 18+ (tested on Node 22).

### Demo accounts (demo mode only)

| Role | Email | Password |
|---|---|---|
| Customer | `layla@example.com` | `Luma2026!` |
| Administrator | `admin@lumabeauty.demo` | `Admin2026!` |

The login page has buttons that fill these in. Admin lives at `/admin`.

**Promo codes to try:** `WELCOME10` (10% over $30, max $25, once per customer) · `LUMADELIVERY` (free delivery over $35) · `EYECARE5` ($5 off eye care) · `SUMMER20` (expired) · `VIP15` (usage limit reached).

**States to try:** sold out — *Rose Quartz Hydrogel Eye Patches*, *Overnight Honey Sleeping Mask*, *Shea Lip Balm → Rose*, *Terry Headband → Blush*, *Retinal Night Eye Balm → 15 ml*; low stock — *Vitamin C Glow Serum* (2), *Gold Peptide 120 jar* (3); discontinued — *Bakuchiol 50 ml*; draft/archived products exist only in admin.

Reset all demo data: **Admin → Store settings → Reset demo data**.

---

## Demo mode vs. production

| | Demo (`VITE_API_MODE=demo`, default) | Production (`VITE_API_MODE=live`) |
|---|---|---|
| API | In-browser mock REST server plugged into Axios as an adapter (`src/services/mock`) | Real HTTP to `VITE_API_BASE_URL` (e.g. ASP.NET Core Web API) |
| Data | Seeded from `src/data`, persisted to `localStorage` per browser | Your database |
| Auth | Random demo token in `localStorage`; SHA-256 demo hashes | **httpOnly, Secure, SameSite cookies** (Axios uses `withCredentials`); ASP.NET Identity/PBKDF2 or Argon2 |
| Authorisation | Demo server rejects admin calls without an admin session (401/403) | **Must be enforced server-side on every admin endpoint.** Client route guards are UX only |
| Orders & stock | Re-priced and stock-checked inside a single synchronous JS call (atomic in one tab only) | **Must run in one DB transaction** with row locks / optimistic concurrency, idempotency keys, audit rows |
| Payments | Cash on delivery + manual transfer; nothing is charged | Same; any online card payment must use a certified provider (hosted fields/redirect). No card data ever touches this app |
| Emails / notifications | Not sent (UI says so) | Order confirmation, password reset, restock notifications via an email provider |

**The UI code is identical in both modes** — every screen calls `src/services/index.js`, which maps 1:1 to REST endpoints. Switching to the real backend is `VITE_API_MODE=live` + `VITE_API_BASE_URL`. Nothing in demo mode pretends to be a real transaction: a banner, the checkout, the confirmation page and the admin all label demo behaviour.

### Business rules (shared, and what the backend must replicate)

These live in pure modules used by both the UI and the demo server, so the backend team has a reference implementation and tests:

- `src/lib/inventory.js` — variant stock states (in stock / low / out / discontinued), truthful low-stock copy.
- `src/lib/pricing.js` — subtotal, coupon eligibility (dates, active flag, global and per-customer limits, minimum spend, category scope, max discount), zone shipping and free-delivery threshold. Money is summed in cents.
- `src/lib/validation.js`, `src/lib/adminValidation.js` — Zod schemas (Lebanese mobile numbers, governorate/district consistency, product/variant/coupon rules).
- `src/services/mock/domain.js` — server-side cart quote (never trusts client prices), stock adjustment with audit trail, restore-inventory-once on cancel/return.

Key rules: inventory belongs to variants; a bag never reserves stock; checkout re-quotes and the server re-validates every line; an order is rejected with `409 STOCK_CHANGED` if anything changed, and with `409 TOTAL_CHANGED` if the client's expected total differs; an `Idempotency-Key` header makes order placement safe to retry; cancelled/returned orders restore stock at most once (`inventoryRestored`); every stock change writes `{before, after, delta, type, who, why}`; reaching zero stock flips the storefront to “Sold out — notify me”, and restocking moves waiting restock requests to “ready”.

---

## API contract required for production

All JSON. Prices in USD. Auth via session cookie. Errors: `{ message, code?, errors?: {field: message}, details? }` with proper HTTP status (400 validation, 401, 403, 404, 409 conflict, 422 business rule).

**Catalogue & store (public)**

| Method | Path | Notes |
|---|---|---|
| GET | `/catalog/products` | `q, category, subcategory, brand, concern, attribute, minPrice, maxPrice, inStock, onSale, isNew, bestseller, sort, page, pageSize` → `{items, total, page, pages, facets, priceBounds}` |
| GET | `/catalog/products/by-ids?ids=` | wishlist / recently viewed |
| GET | `/catalog/products/{slug}` | published only; no cost prices |
| GET | `/catalog/products/{slug}/related` | |
| GET | `/catalog/products/{id}/reviews` | approved only + distribution |
| POST | `/catalog/products/{id}/reviews` | auth; created as `pending` |
| GET | `/catalog/categories` · `/catalog/filters` · `/catalog/home` | |
| GET | `/store/settings` | announcements, shipping zones, enabled payment methods |
| POST | `/restock-requests` | `{productId, variantId, email}` |
| POST | `/newsletter` | `{email}` |

**Cart & orders**

| Method | Path | Notes |
|---|---|---|
| POST | `/cart/quote` | `{items:[{productId,variantId,quantity}], couponCode?, governorate?}` → priced lines with `status: ok|adjusted|unavailable`, totals, coupon result, `canCheckout` |
| POST | `/orders` | header `Idempotency-Key`; `{items, couponCode?, customer:{fullName, phone, email, governorate, district, city, street, building, floor?, landmark?, instructions?, paymentMethod, saveAddress?, acceptTerms}, expectedTotal}` |
| GET | `/orders/track?reference=&phone=` | guest lookup |

**Auth & account**

`POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/forgot-password` · `POST /auth/reset-password` · `PUT /account/profile` · `POST /account/password` · `POST/PUT/DELETE /account/addresses[/{id}]` · `GET /account/orders` · `GET /account/orders/{reference}` · `POST /account/orders/{reference}/cancel` (pending only)

**Admin (role `admin`, enforced server-side)**

| Area | Endpoints |
|---|---|
| Dashboard | `GET /admin/dashboard?days=7|30|90` |
| Products | `GET/POST /admin/products`, `GET/PUT/PATCH/DELETE /admin/products/{id}` (delete refused if in orders → archive) |
| Inventory | `GET /admin/inventory`, `POST /admin/inventory/adjustments` (`mode: add|remove|set`, `type: restock|correction|damage|return`), `PATCH /admin/inventory/{variantId}`, `GET /admin/inventory/adjustments` |
| Orders | `GET /admin/orders`, `GET /admin/orders/{id}`, `POST …/status`, `POST …/payment`, `POST …/cancel` (`restock`), `POST …/refunds` (`amount, reason, restock, markReturned`), `POST …/notes` |
| Catalogue setup | `GET/POST/PUT/DELETE /admin/categories[/{id}]`, `GET/POST/PUT/DELETE /admin/coupons[/{id}]` |
| Customers | `GET /admin/customers`, `GET /admin/customers/{key}` |
| Content | `GET/PUT /admin/content` |
| Engagement | `GET /admin/restock-requests`, `POST /admin/restock-requests/notify`, `DELETE …/{id}`, `GET /admin/reviews`, `PATCH/DELETE /admin/reviews/{id}`, `GET /admin/newsletter` |
| Settings | `GET /admin/settings`, `PUT /admin/settings/shipping`, `PUT /admin/settings/store` |
| Uploads (to add) | signed upload URL endpoint → object storage (the demo stores downscaled data URLs) |

The demo implementation of each endpoint is in `src/services/mock/routes/*.js` and is a precise executable spec.

---

## Project structure

```
scripts/generate-art.mjs   Renders the SVG packshots/editorial art from product `art` data
public/images/             Generated art (replace with real 4:5 photography before launch)
src/
  config/env.js            Brand + API configuration (all public; no secrets)
  constants/               Lebanon governorates/districts, order & payment statuses, catalogue enums
  data/                    Seed catalogue (32 products), people & reviews, orders, settings/content
  lib/                     Pure business rules: pricing, inventory, phone, validation, formatting
  services/
    api/                   Axios client, error normalisation, demo session
    mock/                  Demo REST server: db, router, domain logic, routes
    index.js               Service layer (one function per endpoint)
  stores/                  Zustand: cart, wishlist, recently viewed, UI, toasts, auth
  hooks/                   TanStack Query hooks, page meta/SEO, list params, a11y helpers
  components/
    ui/                    Button, Field/Input/Select/Checkbox/RadioCard, Modal/Drawer, ConfirmDialog, Toaster, Accordion, QuantityStepper, Pagination, Price, Stars, Img, Badge…
    layout/ home/ product/ cart/ order/ account/ admin/
  layouts/                 Store, account and admin shells
  pages/store|account|admin
  routes/                  Router (lazy routes) and guards
  test/                    Vitest suites
```

Brand name, contacts and WhatsApp come from `.env` (`VITE_BRAND_*`) and from **Admin → Store settings**. Text direction/locale are centralised in `config/env.js`; layouts use logical spacing and `rtl-flip` on directional icons as groundwork for Arabic/RTL, but no Arabic translation is included yet.

---

## What was verified

**Automated (`npm test`, 38 passing):**
- Lebanese phone normalisation (valid/invalid prefixes and lengths); checkout schema incl. district-in-governorate.
- Inventory states; seed data includes in-stock, low-stock and sold-out products (≥ 24 published).
- Pricing: zone fees, free-delivery threshold after discount, percent/fixed/category coupons, expired / exhausted / below-minimum / unknown codes.
- Demo API: filtering, search by SKU, sorting, sold-out products stay visible with badge, cost prices never exposed, ratings only from approved reviews; cart quote clamps quantities and flags unavailable lines; guest COD order decrements stock and writes an audit entry; idempotent retry returns the same order; overselling refused (incl. two simultaneous orders for the last units); invalid form and invalid coupon rejected; admin endpoints reject anonymous (401) and customers (403); status transitions enforced; cancel restores stock exactly once; inventory changes reflected on the storefront; restock requests become “ready”; dashboard aggregates.
- Admin schemas: every seed product validates as edited in the form; empty optional numbers stay `null`; coupon limits/dates.

**Manually in Chrome (desktop 1536 px and 390 px phone frames):** home page sections; category page with filters, chips and sort; product page variant selection and sold-out variant → notify form; quantity stepper capped at stock; add to bag toast; cart drawer; expired promo rejected and valid promo applied; empty-form validation with focus on first error; guest COD checkout → confirmation (LUMA-10249); product immediately shown as sold out; admin login → dashboard, order status update, stock adjustment → product back in stock on the storefront; product edit save; all admin pages and the packing slip render without console errors; customer account overview, order detail and addresses; mobile menu, no page-level horizontal overflow at 390 px. `npm run build` succeeds.

**Bugs found and fixed during this verification:** empty “compare-at” and other optional numbers were coerced to 0 (blocked saving products/coupons/shipping); product form brand select reset before options loaded; product save double-transformed form values; coupon dates displayed a day late in Beirut time; announcement bar clipped on phones; toasts covered header icons; desktop rails showed an orphan fifth card.

**Not verified / known limitations:**
- No automated end-to-end browser tests (Playwright) — the journeys above were exercised by hand.
- Only one phone width (390 px) was inspected visually; 320 px and tablets were not screenshot-checked, though layouts use fluid grids and no fixed widths.
- Screen-reader testing with NVDA/VoiceOver was not performed; semantics, labels, focus traps, keyboard paths and contrast tokens were built in but not audited with tooling (e.g. axe).
- Demo-mode “atomicity” is only within one browser tab; two tabs can each hold their own copy of localStorage data.
- Product imagery is generated SVG art direction, not photography. Reviews, customers and orders are sample data and are labelled as such in demo mode.
- Delivery estimates appear only where configured in Admin → Shipping; three regions intentionally have none.
- SEO: titles, descriptions, canonical URLs and Product JSON-LD are set client-side; for full crawlability, pre-render or server-render product and category pages.
- Not implemented: email sending, real image upload storage, Arabic translations, online card payments.
