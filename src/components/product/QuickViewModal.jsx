import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Modal, Img, RatingSummary, Skeleton, ErrorState } from '../ui/index.js';
import { PurchasePanel } from './PurchasePanel.jsx';
import { ProductBadges } from './StockBadge.jsx';
import { useUiStore } from '../../stores/uiStores.js';
import { useProduct } from '../../hooks/queries.js';
import { defaultVariant } from '../../lib/inventory.js';

function QuickViewBody({ slug, onClose }) {
  const { data: product, isLoading, error, refetch } = useProduct(slug);
  const [variantId, setVariantId] = useState(null);
  if (isLoading)
    return (
      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7">
        <Skeleton className="aspect-product w-full" />
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="mt-6 h-12 w-full" />
        </div>
      </div>
    );
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const variant = product.variants.find((v) => v.id === variantId) ?? defaultVariant(product);
  return (
    <div className="grid gap-6 p-5 sm:grid-cols-2 sm:gap-8 sm:p-7">
      <div className="relative">
        <Img src={variant.image || product.images[0]} alt={product.name} eager />
        <ProductBadges badges={product.badges} className="absolute left-2.5 top-2.5" />
      </div>
      <div className="flex flex-col">
        <p className="eyebrow">{product.brand?.name}</p>
        <h2 className="mt-2 font-display text-[1.75rem] leading-tight">{product.name}</h2>
        <RatingSummary rating={product.rating} className="mt-2" />
        <p className="mb-6 mt-3 text-[14px] leading-relaxed text-espresso-soft">{product.shortDescription}</p>
        <PurchasePanel product={product} variantId={variant.id} onVariantChange={setVariantId} compact onAdded={onClose} />
        <Link to={`/product/${product.slug}`} onClick={onClose} className="mt-6 inline-flex items-center gap-2 self-start text-[12px] font-medium uppercase tracking-[0.14em] link-underline">
          Full details <ArrowRight aria-hidden className="rtl-flip h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function QuickViewModal() {
  const slug = useUiStore((s) => s.quickViewSlug);
  const close = useUiStore((s) => s.closeQuickView);
  return (
    <Modal open={Boolean(slug)} onClose={close} size="lg" title="Quick view">
      {slug && <QuickViewBody key={slug} slug={slug} onClose={close} />}
    </Modal>
  );
}
