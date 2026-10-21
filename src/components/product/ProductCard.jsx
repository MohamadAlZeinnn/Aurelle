import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Plus } from 'lucide-react';
import { Img, Price, RatingSummary, Skeleton } from '../ui/index.js';
import { ProductBadges } from './StockBadge.jsx';
import { useUiStore, useWishlistStore } from '../../stores/uiStores.js';
import { useAddToCart, useWishlistToggle } from '../../hooks/useCartActions.js';
import { defaultVariant, isVariantPurchasable } from '../../lib/inventory.js';
import { hasRealVariants } from '../../lib/product.js';
import { cn } from '../../lib/format.js';

export const ProductCard = memo(function ProductCard({ product, eager = false, className }) {
  const [hover, setHover] = useState(false);
  const openQuickView = useUiStore((s) => s.openQuickView);
  const saved = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleWishlist = useWishlistToggle();
  const addToCart = useAddToCart();

  const href = `/product/${product.slug}`;
  const multi = hasRealVariants(product);
  const variant = defaultVariant(product);
  const soldOut = product.stockStatus === 'out_of_stock' || product.stockStatus === 'discontinued';
  const activeVariants = product.variants.filter((v) => !v.discontinued);
  const variantCount = activeVariants.length;
  const onSaleVariant = activeVariants.find((v) => v.compareAtPrice > v.price);

  const quickAction = () => {
    if (soldOut || multi) return openQuickView(product.slug);
    if (isVariantPurchasable(variant)) addToCart(product, variant, 1);
  };
  const actionLabel = soldOut ? 'Notify me' : multi ? 'Choose option' : 'Add to bag';

  return (
    <article className={cn('group relative flex flex-col', className)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative">
        <Link to={href} className="block" tabIndex={-1} aria-hidden>
          <Img src={product.images[0]} alt="" eager={eager} sizes="(min-width:1024px) 25vw, 50vw" imgClassName={cn('transition-transform duration-700 ease-lux group-hover:scale-[1.03]', soldOut && 'opacity-80')} />
          {product.images[2] && (
            <img
              src={product.images[2]}
              alt=""
              loading="lazy"
              width="800"
              height="1000"
              className={cn('absolute inset-0 hidden h-full w-full object-cover transition-opacity duration-500 lg:block', hover ? 'opacity-100' : 'opacity-0')}
            />
          )}
        </Link>
        <ProductBadges badges={product.badges} className="pointer-events-none absolute left-2.5 top-2.5" />
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-1.5 top-1.5 z-10 flex h-10 w-10 items-center justify-center text-espresso transition-colors hover:text-bronze"
        >
          <Heart aria-hidden className={cn('h-[18px] w-[18px]', saved && 'fill-espresso')} strokeWidth={1.4} />
        </button>
        {/* Desktop hover actions */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-10 hidden translate-y-2 gap-1.5 opacity-0 transition-all duration-300 ease-lux group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
          <button type="button" onClick={quickAction} className="btn btn-sm flex-1 bg-ivory/95 text-espresso backdrop-blur hover:bg-espresso hover:text-ivory">
            {actionLabel}
          </button>
          <button type="button" onClick={() => openQuickView(product.slug)} className="btn btn-sm bg-ivory/95 px-3 text-espresso backdrop-blur hover:bg-espresso hover:text-ivory" aria-label={`Quick view ${product.name}`}>
            <Eye aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        {/* Touch quick action */}
        <button
          type="button"
          onClick={quickAction}
          aria-label={`${actionLabel}: ${product.name}`}
          className="absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/95 text-espresso shadow-soft lg:hidden"
        >
          {soldOut ? <Eye aria-hidden className="h-4 w-4" strokeWidth={1.5} /> : <Plus aria-hidden className="h-4 w-4" strokeWidth={1.6} />}
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-taupe">{product.brand?.name}</p>
        <h3 className="mt-1 font-sans text-[14.5px] font-normal leading-snug">
          <Link to={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none [&:focus-visible]:underline">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Price amount={onSaleVariant?.price ?? product.priceMin} compareAt={onSaleVariant?.compareAtPrice} from={product.priceMin !== product.priceMax} size="sm" />
          <RatingSummary rating={product.rating} />
        </div>
        {multi && variantCount > 1 && (
          <p className="mt-1 text-[12px] text-taupe">
            {variantCount} {(product.variantLabel || 'option').toLowerCase()}
            {product.variantLabel?.toLowerCase().endsWith('s') ? '' : 's'}
          </p>
        )}
      </div>
    </article>
  );
});

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-product w-full" />
      <Skeleton className="mt-4 h-3 w-1/3" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-2 h-4 w-1/4" />
    </div>
  );
}

export function ProductGrid({ products, loading, skeletonCount = 8, className, eagerCount = 0 }) {
  return (
    <div className={cn('grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p, i) => <ProductCard key={p.id} product={p} eager={i < eagerCount} />)}
    </div>
  );
}
