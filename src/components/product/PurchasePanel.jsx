import { useEffect, useMemo, useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Button, Price, QuantityStepper } from '../ui/index.js';
import { VariantSelector } from './VariantSelector.jsx';
import { StockLine } from './StockBadge.jsx';
import { NotifyMeForm } from './NotifyMeForm.jsx';
import { defaultVariant, isVariantPurchasable } from '../../lib/inventory.js';
import { useAddToCart, useWishlistToggle } from '../../hooks/useCartActions.js';
import { useCartStore, CART_MAX_PER_LINE } from '../../stores/cartStore.js';
import { useUiStore, useWishlistStore } from '../../stores/uiStores.js';
import { useStoreSettings } from '../../hooks/queries.js';
import { cn } from '../../lib/format.js';

/**
 * Variant selection, quantity and purchase actions. Shared by the product page and quick view.
 * Quantity can never exceed stock minus what is already in the bag.
 */
export function PurchasePanel({ product, variantId, onVariantChange, compact = false, onAdded }) {
  const [internalVariant, setInternalVariant] = useState(() => defaultVariant(product)?.id);
  const selectedId = variantId ?? internalVariant;
  const setSelected = onVariantChange ?? setInternalVariant;
  const variant = useMemo(() => product.variants.find((v) => v.id === selectedId) ?? defaultVariant(product), [product, selectedId]);
  const inBag = useCartStore((s) => s.lines.find((l) => l.variantId === variant?.id)?.quantity ?? 0);
  const [qty, setQty] = useState(1);
  const addToCart = useAddToCart();
  const toggleWishlist = useWishlistToggle();
  const saved = useWishlistStore((s) => s.ids.includes(product.id));
  const { data: settings } = useStoreSettings();
  const openCart = useUiStore((s) => s.openCart);

  const purchasable = isVariantPurchasable(variant);
  const maxQty = Math.max(0, Math.min(CART_MAX_PER_LINE, variant?.stock ?? 0) - inBag);

  useEffect(() => setQty((q) => Math.max(1, Math.min(q, maxQty || 1))), [maxQty, variant?.id]);

  const add = (buyNow = false) => {
    const ok = addToCart(product, variant, qty, { buyNow });
    if (ok) {
      setQty(1);
      onAdded?.();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <Price amount={variant.price} compareAt={variant.compareAtPrice} size="lg" />
        {variant.compareAtPrice > variant.price && <span className="text-[12px] uppercase tracking-[0.14em] text-rosewood">Reduced</span>}
      </div>

      <VariantSelector product={product} value={variant.id} onChange={setSelected} />

      <StockLine variant={variant} showCount={settings?.store?.showLowStockCount !== false} />

      {purchasable ? (
        <div className="space-y-3">
          {maxQty > 0 ? (
            <div className="flex gap-3">
              <QuantityStepper value={qty} max={maxQty} onChange={setQty} />
              <Button className="flex-1" size="lg" onClick={() => add(false)}>
                <ShoppingBag aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                Add to bag
              </Button>
            </div>
          ) : (
            <p className="border border-line bg-linen px-4 py-3 text-[13.5px] text-espresso-soft">
              You have all {inBag} available in your bag.{' '}
              <button type="button" className="link-underline" onClick={openCart}>
                View bag
              </button>
            </p>
          )}
          {!compact && (
            <Button variant="secondary" size="lg" block onClick={() => add(true)}>
              Buy now
            </Button>
          )}
          {inBag > 0 && maxQty > 0 && <p className="text-[12.5px] text-taupe">{inBag} already in your bag.</p>}
        </div>
      ) : (
        <NotifyMeForm key={variant.id} product={product} variant={variant} compact={compact} />
      )}

      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        aria-pressed={saved}
        className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-espresso hover:text-bronze"
      >
        <Heart aria-hidden className={cn('h-4 w-4', saved && 'fill-espresso')} strokeWidth={1.5} />
        {saved ? 'Saved to wishlist' : 'Add to wishlist'}
      </button>
    </div>
  );
}

