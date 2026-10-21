import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { cn } from '../../lib/format.js';
import { formatPrice } from '../../lib/money.js';

export function QuantityStepper({ value, onChange, min = 1, max = 10, size = 'md', label = 'Quantity', disabled = false, className }) {
  const h = size === 'sm' ? 'h-9' : 'h-12';
  const w = size === 'sm' ? 'w-9' : 'w-11';
  const atMax = value >= max;
  return (
    <div className={cn('inline-flex items-stretch border border-line-strong bg-porcelain', h, disabled && 'opacity-50', className)} role="group" aria-label={label}>
      <button type="button" className={cn('flex items-center justify-center text-espresso transition-colors hover:bg-linen disabled:cursor-not-allowed disabled:opacity-35', w)} onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <Minus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
      </button>
      <span aria-live="polite" className={cn('flex min-w-[2.5rem] items-center justify-center border-x border-line text-[14px] tabular-nums', size === 'sm' && 'min-w-[2rem] text-[13px]')}>
        <span className="sr-only">{label}: </span>
        {value}
      </span>
      <button
        type="button"
        className={cn('flex items-center justify-center text-espresso transition-colors hover:bg-linen disabled:cursor-not-allowed disabled:opacity-35', w)}
        onClick={() => onChange(value + 1)}
        disabled={disabled || atMax}
        aria-label={atMax ? `Maximum available quantity reached (${max})` : 'Increase quantity'}
        title={atMax ? `Only ${max} available` : undefined}
      >
        <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
      </button>
    </div>
  );
}

export function Accordion({ items, defaultOpen = [], className, size = 'md' }) {
  const [open, setOpen] = useState(defaultOpen);
  const baseId = useId();
  const toggle = (key) => setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]));
  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item, i) => {
        const key = item.key ?? i;
        const isOpen = open.includes(key);
        const panelId = `${baseId}-p${i}`;
        const btnId = `${baseId}-b${i}`;
        return (
          <div key={key}>
            <h3 className="font-sans">
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(key)}
                className={cn('flex w-full items-center justify-between gap-4 text-left font-medium transition-colors hover:text-bronze', size === 'sm' ? 'py-3.5 text-[14px]' : 'py-4 text-[14.5px]')}
              >
                {item.title}
                <Plus aria-hidden className={cn('h-4 w-4 shrink-0 transition-transform duration-300', isOpen && 'rotate-45')} strokeWidth={1.5} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-5 text-[14.5px] leading-relaxed text-espresso-soft">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function Pagination({ page, pages, onChange, className }) {
  if (pages <= 1) return null;
  const numbers = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) numbers.push(i);
  const withGaps = numbers.flatMap((n, i) => (i && n - numbers[i - 1] > 1 ? ['…', n] : [n]));
  const btn = 'flex h-10 min-w-10 items-center justify-center px-2 text-[14px] transition-colors';
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1', className)}>
      <button type="button" className={cn(btn, 'hover:bg-linen disabled:opacity-30')} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft aria-hidden className="rtl-flip h-4 w-4" strokeWidth={1.5} />
      </button>
      {withGaps.map((n, i) =>
        n === '…' ? (
          <span key={`g${i}`} className="px-1 text-taupe">
            …
          </span>
        ) : (
          <button key={n} type="button" onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined} className={cn(btn, n === page ? 'border-b border-espresso font-medium' : 'text-taupe hover:text-espresso')}>
            {n}
          </button>
        )
      )}
      <button type="button" className={cn(btn, 'hover:bg-linen disabled:opacity-30')} onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
        <ChevronRight aria-hidden className="rtl-flip h-4 w-4" strokeWidth={1.5} />
      </button>
    </nav>
  );
}

export function Price({ amount, compareAt, className, size = 'md', from = false }) {
  const onSale = compareAt && compareAt > amount;
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', size === 'lg' ? 'text-[1.35rem]' : size === 'sm' ? 'text-[13.5px]' : 'text-[15px]', className)}>
      <span className={cn('tabular-nums', onSale && 'text-rosewood')}>
        {from && <span className="mr-1 text-[0.8em] text-taupe">From</span>}
        {onSale && <span className="sr-only">Sale price </span>}
        {formatPrice(amount)}
      </span>
      {onSale && (
        <s className="text-[0.85em] tabular-nums text-taupe">
          <span className="sr-only">Original price </span>
          {formatPrice(compareAt)}
        </s>
      )}
    </span>
  );
}

export function Stars({ value, size = 14, className }) {
  return (
    <span className={cn('inline-flex items-center gap-[2px] text-bronze', className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-line-strong" style={{ width: size, height: size }} strokeWidth={1.2} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="fill-bronze text-bronze" style={{ width: size, height: size }} strokeWidth={1.2} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingSummary({ rating, className, showCount = true }) {
  if (!rating?.count) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[12.5px] text-taupe', className)}>
      <Stars value={rating.average} size={12} />
      <span className="sr-only">Rated {rating.average} out of 5</span>
      {showCount && <span>({rating.count})</span>}
    </span>
  );
}

/** Image with reserved aspect ratio, lazy loading, a soft loading state and graceful failure. */
export function Img({ src, alt, ratio = 'aspect-product', className, imgClassName, eager = false, sizes, width = 800, height = 1000 }) {
  const [state, setState] = useState('loading');
  return (
    <div className={cn('relative overflow-hidden bg-linen', ratio, className)}>
      {state !== 'error' && src ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', state === 'loaded' ? 'opacity-100' : 'opacity-0', imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-[12px] uppercase tracking-[0.14em] text-taupe" role="img" aria-label={alt}>
          Image unavailable
        </div>
      )}
      {state === 'loading' && src && <div aria-hidden className="skeleton absolute inset-0" />}
    </div>
  );
}
