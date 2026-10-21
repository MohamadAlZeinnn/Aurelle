import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Tag, Truck, X } from 'lucide-react';
import { useCartStore, CART_MAX_PER_LINE } from '../../stores/cartStore.js';
import { useWishlistStore, toast } from '../../stores/uiStores.js';
import { useProduct } from '../../hooks/queries.js';
import { Button, Input, Notice, Price, QuantityStepper, Select, Skeleton } from '../ui/index.js';
import { formatPrice } from '../../lib/money.js';
import { cn } from '../../lib/format.js';

function VariantEditor({ line }) {
  const { data: product } = useProduct(line.slug);
  const changeVariant = useCartStore((s) => s.changeVariant);
  if (!product || product.variants.filter((v) => !v.discontinued).length < 2) return null;
  return (
    <label className="mt-2 flex items-center gap-2 text-[12.5px] text-taupe">
      <span className="shrink-0">{product.variantLabel || 'Option'}</span>
      <Select
        className="!min-h-[34px] max-w-[190px] py-0 text-[13px]"
        value={line.variantId}
        onChange={(e) => {
          changeVariant(line.variantId, e.target.value);
          toast.show('Bag updated', { description: `${line.name} changed to ${product.variants.find((v) => v.id === e.target.value)?.name}.`, duration: 2500 });
        }}
      >
        {product.variants
          .filter((v) => !v.discontinued)
          .map((v) => (
            <option key={v.id} value={v.id} disabled={v.stock <= 0}>
              {v.name}
              {v.stock <= 0 ? ' — sold out' : ''}
            </option>
          ))}
      </Select>
    </label>
  );
}

/** One bag line. Unavailable lines stay visible with a clear explanation. */
export function CartLineItem({ line, editable = false, onNavigate }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const saveToWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) => s.ids.includes(line.productId));
  const unavailable = line.status === 'unavailable';
  const max = Math.min(CART_MAX_PER_LINE, line.available);

  const remove = () => {
    removeItem(line.variantId);
    toast.show('Removed from your bag', { description: line.name, duration: 2500 });
  };

  const moveToWishlist = () => {
    if (!inWishlist) saveToWishlist(line.productId);
    removeItem(line.variantId);
    toast.show('Moved to your wishlist', { description: line.name, duration: 2500 });
  };

  return (
    <li className={cn('flex gap-4 py-5', unavailable && 'opacity-95')}>
      <Link to={line.slug ? `/product/${line.slug}` : '#'} onClick={onNavigate} className="block w-[84px] shrink-0 sm:w-[96px]" tabIndex={-1} aria-hidden>
        <div className="aspect-product overflow-hidden bg-linen">
          {line.image && <img src={line.image} alt="" width="96" height="120" loading="lazy" className={cn('h-full w-full object-cover', unavailable && 'grayscale-[60%]')} />}
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.brandName && <p className="text-[10.5px] uppercase tracking-[0.14em] text-taupe">{line.brandName}</p>}
            <p className="mt-0.5 text-[14.5px] leading-snug">
              {line.slug ? (
                <Link to={`/product/${line.slug}`} onClick={onNavigate} className="hover:underline">
                  {line.name}
                </Link>
              ) : (
                line.name
              )}
            </p>
            {line.variantName && !editable && <p className="mt-0.5 text-[12.5px] text-taupe">{line.variantName}</p>}
            {editable && line.slug && !unavailable && <VariantEditor line={line} />}
            {editable && unavailable && line.variantName && <p className="mt-0.5 text-[12.5px] text-taupe">{line.variantName}</p>}
          </div>
          <button type="button" onClick={remove} className="-mr-2 -mt-1 p-2 text-taupe transition-colors hover:text-espresso" aria-label={`Remove ${line.name} from bag`}>
            <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {unavailable ? (
          <div className="mt-3 space-y-2">
            <p className="text-[13px] text-rosewood">
              {line.reason === 'discontinued' ? 'This option has been discontinued.' : line.reason === 'removed' ? 'This item is no longer available.' : 'Sold out since you added it.'} Remove it to continue to checkout.
            </p>
            <div className="flex gap-4 text-[12px] font-medium uppercase tracking-[0.12em]">
              <button type="button" onClick={remove} className="link-underline">
                Remove
              </button>
              {line.slug && (
                <button type="button" onClick={moveToWishlist} className="link-underline inline-flex items-center gap-1">
                  <Heart aria-hidden className="h-3 w-3" /> Save for later
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <QuantityStepper size="sm" value={Math.min(line.quantity, Math.max(1, max))} max={max} onChange={(q) => setQuantity(line.variantId, q)} label={`Quantity of ${line.name}`} />
            <div className="text-right">
              <Price amount={line.lineTotal} size="sm" />
              {line.quantity > 1 && <p className="text-[11.5px] text-taupe">{formatPrice(line.unitPrice)} each</p>}
            </div>
          </div>
        )}
        {!unavailable && line.stockStatus === 'low_stock' && <p className="mt-2 text-[12px] text-amber">Only {line.available} left in stock</p>}
      </div>
    </li>
  );
}

export function CartLineSkeleton() {
  return (
    <li className="flex gap-4 py-5" aria-hidden>
      <Skeleton className="aspect-product w-[84px]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-6 h-9 w-28" />
      </div>
    </li>
  );
}

export function FreeShippingProgress({ quote, className }) {
  if (quote?.freeShippingThreshold == null) return null;
  const remaining = quote.amountToFreeShipping;
  const pct = Math.min(100, ((quote.freeShippingThreshold - remaining) / quote.freeShippingThreshold) * 100);
  return (
    <div className={className}>
      <p className="flex items-center gap-2 text-[13px]">
        <Truck aria-hidden className="h-4 w-4 text-bronze" strokeWidth={1.4} />
        {quote.qualifiesFreeShipping ? (
          <span>Your order qualifies for complimentary delivery.</span>
        ) : (
          <span>
            Add <strong className="font-medium">{formatPrice(remaining)}</strong> for complimentary delivery.
          </span>
        )}
      </p>
      <div className="mt-2.5 h-[3px] w-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Progress towards complimentary delivery">
        <div className="h-full bg-espresso transition-[width] duration-500 ease-lux" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PromoCodeForm({ quote, isFetching }) {
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  // When the server rejects a code, show why and drop it from the bag.
  useEffect(() => {
    if (!pending || isFetching || !quote?.coupon) return;
    setPending(false);
    if (!quote.coupon.valid) {
      setError(quote.coupon.message);
      removeCoupon();
    } else {
      setValue('');
      setError(null);
    }
  }, [quote, isFetching, pending, removeCoupon]);

  const submit = (e) => {
    e.preventDefault();
    const code = value.trim();
    if (!code) return setError('Enter a promo code.');
    if (!/^[A-Za-z0-9]{3,24}$/.test(code)) return setError('Promo codes contain letters and numbers only.');
    setError(null);
    setPending(true);
    applyCoupon(code);
  };

  if (couponCode && quote?.coupon?.valid) {
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-line-strong bg-ivory px-3.5 py-2.5 text-[13px]">
        <span className="flex items-center gap-2">
          <Tag aria-hidden className="h-3.5 w-3.5 text-bronze" strokeWidth={1.5} />
          <span className="font-medium tracking-[0.08em]">{couponCode}</span>
          <span className="text-taupe">{quote.coupon.message}</span>
        </span>
        <button type="button" onClick={removeCoupon} className="text-[12px] uppercase tracking-[0.12em] link-underline">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="promo" className="field-label">
        Promo code
      </label>
      <div className="flex gap-2">
        <Input id="promo" value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} placeholder="Enter code" autoComplete="off" aria-invalid={error ? 'true' : undefined} aria-describedby={error ? 'promo-error' : undefined} className="uppercase tracking-[0.08em]" />
        <Button type="submit" variant="secondary" loading={pending && isFetching}>
          Apply
        </Button>
      </div>
      {error && (
        <p id="promo-error" role="alert" className="field-error">
          {error}
        </p>
      )}
    </form>
  );
}

/** Totals block. Shipping shows "Calculated at checkout" until a region is known. */
export function OrderTotals({ quote, className, showEstimate = true }) {
  if (!quote) return null;
  const rows = [
    ['Subtotal', formatPrice(quote.subtotal)],
    quote.discount > 0 && [`Discount${quote.coupon?.code ? ` (${quote.coupon.code})` : ''}`, `−${formatPrice(quote.discount)}`, 'text-sage'],
    ['Delivery', quote.shippingFee == null ? <span className="text-taupe">Calculated at checkout</span> : quote.shippingFee === 0 ? 'Complimentary' : formatPrice(quote.shippingFee)],
  ].filter(Boolean);
  return (
    <dl className={cn('space-y-2.5 text-[14px]', className)}>
      {rows.map(([label, value, cls]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-espresso-soft">{label}</dt>
          <dd className={cn('tabular-nums', cls)}>{value}</dd>
        </div>
      ))}
      {showEstimate && quote.shippingZone?.estimate && <p className="text-[12.5px] text-taupe">Estimated delivery: {quote.shippingZone.estimate} after confirmation.</p>}
      <div className="flex justify-between gap-4 border-t border-line pt-3.5 text-[16px]">
        <dt className="font-medium">Total</dt>
        <dd className="font-medium tabular-nums">
          <span className="mr-1.5 text-[11px] font-normal tracking-[0.1em] text-taupe">USD</span>
          {formatPrice(quote.total)}
        </dd>
      </div>
    </dl>
  );
}

export function CartNotices() {
  const notices = useCartStore((s) => s.notices);
  const dismiss = useCartStore((s) => s.dismissNotice);
  if (!notices.length) return null;
  return (
    <div className="space-y-2">
      {notices.map((n) => (
        <Notice key={n.id} tone="warning" onDismiss={() => dismiss(n.id)}>
          {n.message}
        </Notice>
      ))}
    </div>
  );
}

export function CheckoutBlockers({ quote }) {
  if (!quote || quote.canCheckout || !quote.items.length) return null;
  const unavailable = quote.items.filter((i) => i.status === 'unavailable').length;
  if (!unavailable) return null;
  return (
    <Notice tone="error" title="Some items need your attention">
      {unavailable === 1 ? 'One item in your bag is no longer available.' : `${unavailable} items in your bag are no longer available.`} Remove {unavailable === 1 ? 'it' : 'them'} to continue to checkout.
    </Notice>
  );
}
