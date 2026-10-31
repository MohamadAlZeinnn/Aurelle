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
| Store config (WhatsApp number, announcements, delivery fee, free-delivery threshold, LBP rate, COD, contact, socials) | `src/data/site-config.ts` |
| WhatsApp links & pre-filled order message | `src/lib/whatsapp.ts` |
| FAQ copy | `src/data/faq.ts` |
| Editorial (non-product) imagery | `src/data/editorial.ts` |
| Policy page templates | `src/data/policies.tsx` |
| Design tokens (colours, type scale, spacing, motion) | `src/app/globals.css` (`@theme`) |
| Validation (newsletter, contact) | `src/lib/validation.ts` |
| Database schema (newsletter, contact messages) | `supabase/schema.sql` |

Adding a product = appending to `products` in `src/data/products.ts`. The shop page, product
route, WhatsApp order message, search, sitemap and structured data all read from it.

## Ordering

All orders are placed on **WhatsApp** (`siteConfig.ordering.whatsapp`). There is no cart or
checkout: "Order on WhatsApp" buttons open a chat with the product, quantity (and scent, if
configured) pre-filled, plus prompts for name and address. The price is only included in the
message once it is no longer a placeholder. Payment is cash on delivery. Old `/cart` and
`/checkout` URLs redirect to the product page.

## Content honesty rules built in

- **No invented specs.** Every manufacturer field in `specifications` is `null` until supplied and
  renders as "to be confirmed" — on the product page and in the FAQ.
- **Placeholders are visible.** Prices and fees with `isPlaceholder: true` show a dashed
  `PLACEHOLDER` tag; images without `src` render an illustrated stand-in labelled
  *Photography placeholder* with the shot brief; stand-in photos (`isPlaceholder` on an image
  with `src`) show a *Placeholder image* tag and are left out of structured data.
- **No fake reviews/ratings.** None are rendered or emitted in structured data. Product JSON-LD
  omits `offers` while the price is a placeholder.

The newsletter and contact forms store submissions only when `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are set (run `supabase/schema.sql` first); otherwise they run in a
clearly labelled demo mode and nothing is recorded.

## Images

Current product and hero photos in `public/images/placeholders/` are stand-ins cropped from
supplier imagery (1024px source, upscaled to 1200px). Replace them with original AURELLE
photography at **≥ 2000px on the long edge** for crisp results on large and retina screens.

## Launch checklist

- [ ] Real retail price → `products.ts`, set `isPlaceholder: false`
- [ ] Delivery fee, free-delivery threshold, delivery estimate, returns window → `site-config.ts`
- [ ] Manufacturer specifications (features, how to use, materials, safety, wear duration, reusability, daily use, sensitive skin, contents) → `products.ts`
- [ ] "How does it work?" answer → `faq.ts`
- [ ] Product photography (5 images) + editorial photography → set `src` in `products.ts` / `editorial.ts`, remove `isPlaceholder`
- [ ] Contact email, Instagram & TikTok URLs → `site-config.ts` (set `contact.isPlaceholder: false`)
- [ ] Policies reviewed by a legal adviser; set `isDraft: false` → `policies.tsx`
- [ ] Supabase project + env vars (newsletter/contact); `NEXT_PUBLIC_SITE_URL` set to the production domain
- [ ] Optional: LBP indicative rate (`currency.lbpRate`)
