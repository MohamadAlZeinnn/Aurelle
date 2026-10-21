import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, RotateCcw, Truck } from 'lucide-react';
import { ProductGallery } from '../../components/product/ProductGallery.jsx';
import { PurchasePanel } from '../../components/product/PurchasePanel.jsx';
import { ProductReviews } from '../../components/product/Reviews.jsx';
import { ProductBadges } from '../../components/product/StockBadge.jsx';
import { ProductRail, SectionHeader } from '../../components/home/Sections.jsx';
import { Accordion, Button, ErrorState, Price, RatingSummary, Skeleton } from '../../components/ui/index.js';
import { useProduct, useProductsByIds, useRelated, useStoreSettings } from '../../hooks/queries.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useAddToCart } from '../../hooks/useCartActions.js';
import { useRecentlyViewedStore } from '../../stores/uiStores.js';
import { defaultVariant, isVariantPurchasable } from '../../lib/inventory.js';
import { formatPrice } from '../../lib/money.js';
import NotFoundPage from './NotFoundPage.jsx';

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Skeleton className="aspect-product w-full" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-8 h-12 w-full" />
      </div>
    </div>
  );
}

function DeliveryInfo() {
  const { data } = useStoreSettings();
  const fees = data?.shipping?.zones?.filter((z) => z.enabled).map((z) => z.fee) ?? [];
  const threshold = data?.shipping?.freeShippingThreshold;
  return (
    <ul className="space-y-3 border-y border-line py-5 text-[13.5px]">
      <li className="flex gap-3">
        <Banknote aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-bronze" strokeWidth={1.4} />
        <span>Cash on delivery across Lebanon — no online payment needed.</span>
      </li>
      <li className="flex gap-3">
        <Truck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-bronze" strokeWidth={1.4} />
        <span>
          {fees.length ? `Delivery from ${formatPrice(Math.min(...fees))} depending on your governorate` : 'Delivery fees shown at checkout'}
          {threshold != null && `, complimentary over ${formatPrice(threshold)}`}.{' '}
          <Link to="/pages/delivery" className="link-underline">
            Details
          </Link>
        </span>
      </li>
      <li className="flex gap-3">
        <RotateCcw aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-bronze" strokeWidth={1.4} />
        <span>
          Unopened items can be returned within 14 days.{' '}
          <Link to="/pages/returns" className="link-underline">
            Returns policy
          </Link>
        </span>
      </li>
    </ul>
  );
}

function StickyMobileBar({ product, variant, visible }) {
  const addToCart = useAddToCart();
  const purchasable = isVariantPurchasable(variant);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px]">{product.name}</p>
              <p className="text-[12.5px] text-taupe">
                {variant.name !== 'Default' && `${variant.name} · `}
                <Price amount={variant.price} compareAt={variant.compareAtPrice} size="sm" />
              </p>
            </div>
            {purchasable ? (
              <Button onClick={() => addToCart(product, variant, 1)}>Add to bag</Button>
            ) : (
              <Button variant="secondary" onClick={() => document.getElementById('purchase')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                Notify me
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RecentlyViewed({ currentId }) {
  const ids = useRecentlyViewedStore((s) => s.ids).filter((id) => id !== currentId).slice(0, 4);
  const { data = [], isLoading } = useProductsByIds(ids);
  if (!ids.length || (!isLoading && !data.length)) return null;
  return (
    <section className="container-page" aria-labelledby="recent-title">
      <SectionHeader title={<span id="recent-title">Recently viewed</span>} />
      <ProductRail products={data} loading={isLoading && !data.length} label="Recently viewed" />
    </section>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error, refetch } = useProduct(slug);
  const { data: related = [], isLoading: relatedLoading } = useRelated(slug);
  const pushRecent = useRecentlyViewedStore((s) => s.push);
  const [variantId, setVariantId] = useState(null);
  const [showSticky, setShowSticky] = useState(false);
  const purchaseRef = useRef(null);

  useEffect(() => setVariantId(null), [slug]);
  useEffect(() => {
    if (product) pushRecent(product.id);
  }, [product, pushRecent]);

  // Show the sticky mobile bar once the main purchase area scrolls out of view.
  useEffect(() => {
    const el = purchaseRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [product]);

  const variant = useMemo(() => (product ? product.variants.find((v) => v.id === variantId) ?? defaultVariant(product) : null), [product, variantId]);
  const images = useMemo(() => {
    if (!product) return [];
    const variantImages = product.variants.map((v) => v.image).filter(Boolean);
    return [...new Set([...(variant?.image ? [variant.image] : []), ...product.images, ...variantImages])];
  }, [product, variant]);

  usePageMeta({
    title: product?.name,
    description: product ? `${product.shortDescription} ${product.brand?.name}. Cash on delivery across Lebanon.` : undefined,
    image: product?.images[0],
    jsonLd: product && {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.shortDescription,
      image: product.images.map((i) => new URL(i, window.location.origin).href),
      brand: { '@type': 'Brand', name: product.brand?.name },
      sku: product.variants[0]?.sku,
      offers: product.variants
        .filter((v) => !v.discontinued)
        .map((v) => ({
          '@type': 'Offer',
          sku: v.sku,
          price: v.price.toFixed(2),
          priceCurrency: 'USD',
          availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: window.location.href,
        })),
      ...(product.rating.count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating.average, reviewCount: product.rating.count } } : {}),
    },
  });

  if (isLoading) return <ProductSkeleton />;
  if (error?.status === 404) return <NotFoundPage />;
  if (error) return <ErrorState error={error} onRetry={refetch} className="py-32" />;

  const details = [
    {
      key: 'desc',
      title: 'Description',
      content: (
        <>
          <p>{product.description}</p>
          {product.benefits.length > 0 && (
            <ul className="mt-4 list-disc space-y-1.5 pl-5">
              {product.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </>
      ),
    },
    product.keyIngredients.length > 0 && {
      key: 'key',
      title: 'Key ingredients',
      content: (
        <dl className="space-y-3">
          {product.keyIngredients.map((k) => (
            <div key={k.name}>
              <dt className="font-medium text-espresso">{k.name}</dt>
              <dd>{k.purpose}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    product.directions && { key: 'use', title: 'How to use', content: <p>{product.directions}</p> },
    product.ingredients && { key: 'inci', title: 'Full ingredients', content: <p className="text-[13px] leading-relaxed">{product.ingredients}</p> },
    product.specifications.length > 0 && {
      key: 'spec',
      title: 'Specifications',
      content: (
        <dl className="divide-y divide-line">
          {[...product.specifications, { label: 'SKU', value: variant.sku }].map((s) => (
            <div key={s.label} className="flex justify-between gap-4 py-2 text-[13.5px]">
              <dt className="text-taupe">{s.label}</dt>
              <dd className="text-right">{s.value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="space-y-20 pb-10 sm:space-y-28">
      <div className="container-page pt-6 sm:pt-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12.5px] text-taupe">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-espresso">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to={`/shop/${product.category?.slug}`} className="hover:text-espresso">
                {product.category?.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-espresso">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div className="relative">
            <ProductGallery images={images} alt={product.name} focusImage={variant?.image} />
            <ProductBadges badges={product.badges} className="pointer-events-none absolute left-3 top-3 lg:left-[92px]" />
          </div>

          <div className="lg:sticky lg:top-[150px] lg:self-start">
            <p className="eyebrow">
              <Link to={`/shop?brand=${product.brand?.slug}`} className="hover:text-espresso">
                {product.brand?.name}
              </Link>
            </p>
            <h1 className="mt-3 font-display text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">{product.name}</h1>
            {product.rating.count > 0 && (
              <a href="#reviews" className="mt-3 inline-block">
                <RatingSummary rating={product.rating} />
              </a>
            )}
            <p className="mt-4 text-[15px] leading-relaxed text-espresso-soft">{product.shortDescription}</p>
            <div id="purchase" ref={purchaseRef} className="mt-7 scroll-mt-40">
              <PurchasePanel product={product} variantId={variant.id} onVariantChange={setVariantId} />
            </div>
            <div className="mt-8">
              <DeliveryInfo />
            </div>
            <Accordion className="mt-2 border-t-0" items={details} defaultOpen={['desc']} />
          </div>
        </div>
      </div>

      {product.faqs.length > 0 && (
        <section className="container-page" aria-labelledby="faq-title">
          <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-16">
            <h2 id="faq-title" className="section-title">
              Questions
            </h2>
            <Accordion items={product.faqs.map((f) => ({ title: f.q, content: f.a }))} />
          </div>
        </section>
      )}

      <div className="container-page">
        <ProductReviews product={product} />
      </div>

      {(relatedLoading || related.length > 0) && (
        <section className="container-page" aria-labelledby="related-title">
          <SectionHeader eyebrow="Pairs well with" title={<span id="related-title">You may also like</span>} />
          <ProductRail products={related} loading={relatedLoading} label="Related products" />
        </section>
      )}

      <RecentlyViewed currentId={product.id} />

      <StickyMobileBar product={product} variant={variant} visible={showSticky} />
    </div>
  );
}
