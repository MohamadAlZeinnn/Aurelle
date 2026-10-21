import { useId, useRef } from 'react';
import { cn } from '../../lib/format.js';
import { formatPrice } from '../../lib/money.js';

/**
 * Accessible radio group for sizes, shades and colours. Unavailable options stay
 * selectable so shoppers can request a restock notification for them.
 */
export function VariantSelector({ product, value, onChange, className }) {
  const id = useId();
  const refs = useRef([]);
  const variants = product.variants.filter((v) => !v.discontinued || v.id === value);
  if (variants.length <= 1 && variants[0]?.name === 'Default') return null;
  const selected = product.variants.find((v) => v.id === value);
  const isSwatch = variants.some((v) => v.swatch);
  const prices = new Set(variants.map((v) => v.price));

  const onKeyDown = (e, index) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + variants.length) % variants.length;
    onChange(variants[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <p id={id} className="mb-2.5 text-[13px]">
        <span className="text-taupe">{product.variantLabel || 'Option'}:</span> <span className="font-medium">{selected?.name}</span>
        {selected?.stockStatus === 'out_of_stock' && <span className="ml-2 text-rosewood">· Sold out</span>}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-2">
        {variants.map((v, i) => {
          const active = v.id === value;
          const unavailable = v.stockStatus === 'out_of_stock' || v.discontinued;
          const label = `${v.name}${unavailable ? ' — sold out' : ''}${prices.size > 1 ? `, ${formatPrice(v.price)}` : ''}`;
          return isSwatch ? (
            <button
              key={v.id}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              title={label}
              tabIndex={active ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => onChange(v.id)}
              className={cn('relative flex h-10 w-10 items-center justify-center rounded-full border transition-all', active ? 'border-espresso' : 'border-transparent hover:border-line-strong')}
            >
              <span className="block h-8 w-8 rounded-full border border-espresso/10" style={{ backgroundColor: v.swatch }} />
              {unavailable && <span aria-hidden className="absolute h-px w-9 rotate-45 bg-espresso/60" />}
            </button>
          ) : (
            <button
              key={v.id}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              tabIndex={active ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => onChange(v.id)}
              className={cn(
                'relative min-h-[44px] border px-4 text-[13.5px] transition-colors',
                active ? 'border-espresso bg-espresso text-ivory' : 'border-line-strong bg-porcelain hover:border-espresso',
                unavailable && !active && 'text-taupe line-through decoration-taupe-light',
                unavailable && active && 'bg-espresso-soft'
              )}
            >
              {v.name}
              {prices.size > 1 && <span className={cn('ml-2 text-[12px]', active ? 'text-ivory/70' : 'text-taupe')}>{formatPrice(v.price)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
