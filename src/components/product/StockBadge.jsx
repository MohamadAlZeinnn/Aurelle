import { Badge } from '../ui/Badge.jsx';
import { STOCK_STATES } from '../../constants/catalog.js';
import { cn } from '../../lib/format.js';

/** Stock status badge for admin tables and order screens. */
export function StockBadge({ status, className }) {
  const s = STOCK_STATES[status] ?? STOCK_STATES.in_stock;
  return (
    <Badge tone={s.tone} dot className={className}>
      {s.label}
    </Badge>
  );
}

/** Quiet inline stock line for the storefront (never invents urgency). */
export function StockLine({ variant, showCount = true, className }) {
  if (!variant) return null;
  const status = variant.stockStatus;
  const map = {
    in_stock: ['bg-sage', 'In stock'],
    low_stock: ['bg-amber', showCount ? (variant.stock === 1 ? 'Only 1 left in stock' : `Only ${variant.stock} left in stock`) : 'Low stock'],
    out_of_stock: ['bg-rosewood', 'Sold out — notify me when it’s back'],
    discontinued: ['bg-taupe-light', 'No longer available'],
  };
  const [dot, label] = map[status] ?? map.in_stock;
  return (
    <p className={cn('flex items-center gap-2 text-[13px] text-espresso-soft', className)}>
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </p>
  );
}

const CARD_BADGE = {
  'sold-out': 'bg-espresso text-ivory',
  sale: 'bg-porcelain text-rosewood',
  new: 'bg-porcelain text-espresso',
  bestseller: 'bg-champagne-soft text-espresso',
  limited: 'bg-porcelain text-amber',
};

export function ProductBadges({ badges = [], className }) {
  if (!badges.length) return null;
  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      {badges.map((b) => (
        <span key={b.key} className={cn('px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.16em]', CARD_BADGE[b.key])}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
