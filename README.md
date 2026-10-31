# AURELLE — Storefront

Premium single-product storefront for **AURELLE**, launching in Lebanon with the **Steam Eye Mask**.
Built with Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide · Zod.

```bash
npm install
cp .env.example .env.local   # optional — see "Going live"
npm run dev                   # http://localhost:3000
npm run build && npm start    # production
npm run lint                  # type-check
```

## Where things live

| What | File |
| --- | --- |
| Product data (price, variants, images, manufacturer specs) | `src/data/products.ts` |
| Store config (announcements, delivery fee, free-delivery threshold, LBP rate, COD, contact, socials) | `src/data/site-config.ts` |
| FAQ copy | `src/data/faq.ts` |
| Editorial (non-product) imagery | `src/data/editorial.ts` |
| Policy page templates | `src/data/policies.tsx` |
| Design tokens (colours, type scale, spacing, motion) | `src/app/globals.css` (`@theme`) |
| Pricing — shared by browser and server | `src/lib/pricing.ts` |
| Validation (checkout, Lebanese phone numbers, newsletter, contact) | `src/lib/validation.ts` |
| Order API (server-side validation + price recomputation) | `src/app/api/orders/route.ts` |
| Payment provider architecture | `src/lib/server/payments.ts` |
| Database schema | `supabase/schema.sql` |

Adding a product = appending to `products` in `src/data/products.ts`. The shop page, product
route, cart, checkout, search, sitemap and structured data all read from it.

## Content honesty rules built in

- **No invented specs.** Every manufacturer field in `specifications` is `null` until supplied and
  renders as "to be confirmed" — on the product page and in the FAQ.
- **Placeholders are visible.** Prices and fees with `isPlaceholder: true` show a dashed
  `PLACEHOLDER` tag; images without `src` render an illustrated stand-in labelled
  *Photography placeholder* with the shot brief.
- **No fake reviews/ratings.** None are rendered or emitted in structured data. Product JSON-LD
  omits `offers` while the price is a placeholder.
- **No simulated orders.** See below.

## Demo vs. live checkout

Checkout is **live** only when **both** are true:

1. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (run `supabase/schema.sql` first), and
2. no price or delivery fee is still flagged `isPlaceholder`.

Otherwise it runs in clearly labelled **demo mode**: the form is fully validated on the server,
but nothing is recorded, no payment is taken and the bag is kept. The newsletter and contact
forms follow the same rule.

Cash on Delivery is toggled in `site-config.ts`. Online card payment appears only once a
`PaymentProvider` adapter (e.g. Areeba / MPGS) is implemented and registered in
`src/lib/server/payments.ts`, and `PAYMENT_PROVIDER` + credentials are set. Orders paid by
card are stored as `awaiting_payment` and must be confirmed by the provider's webhook only.

## Launch checklist

- [ ] Real retail price → `products.ts`, set `isPlaceholder: false`
- [ ] Delivery fee, free-delivery threshold, delivery estimate, returns window → `site-config.ts`
- [ ] Manufacturer specifications (features, how to use, materials, safety, wear duration, reusability, daily use, sensitive skin, contents) → `products.ts`
- [ ] "How does it work?" answer → `faq.ts`
- [ ] Product photography (5 images) + editorial photography → set `src` in `products.ts` / `editorial.ts`
- [ ] Contact email/phone, Instagram & TikTok URLs → `site-config.ts` (set `contact.isPlaceholder: false`)
- [ ] Policies reviewed by a legal adviser; set `isDraft: false` → `policies.tsx`
- [ ] Supabase project + env vars; `NEXT_PUBLIC_SITE_URL` set to the production domain
- [ ] Optional: LBP indicative rate (`currency.lbpRate`), card payment provider
