import { Link } from 'react-router-dom';
import { Check, Circle, X, RotateCcw } from 'lucide-react';
import { Badge } from '../ui/index.js';
import { FULFILLMENT_FLOW, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../../constants/orders.js';
import { governorateName } from '../../constants/lebanon.js';
import { formatDate, formatDateTime, pluralize, cn } from '../../lib/format.js';
import { formatPrice } from '../../lib/money.js';
import { formatLebanesePhone } from '../../lib/phone.js';

export function OrderStatusBadge({ status, className }) {
  const s = ORDER_STATUSES[status] ?? { label: status, tone: 'neutral' };
  return (
    <Badge tone={s.tone} dot className={className}>
      {s.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, className }) {
  const s = PAYMENT_STATUSES[status] ?? { label: status, tone: 'neutral' };
  return (
    <Badge tone={s.tone} className={className}>
      {s.label}
    </Badge>
  );
}

export const paymentMethodLabel = (order) => (order.paymentMethod === 'cod' ? 'Cash on delivery' : PAYMENT_METHODS[order.paymentMethod]?.label ?? order.paymentMethod);

/** Summary card used in account order history and admin mobile lists. */
export function OrderCard({ order, to, showCustomer = false }) {
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <article className="card relative flex flex-col gap-4 p-4 transition-colors hover:border-line-strong sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-taupe">Order</p>
          <h3 className="font-sans text-[15px] font-medium tracking-[0.04em]">
            <Link to={to} className="after:absolute after:inset-0 after:content-['']">
              {order.reference}
            </Link>
          </h3>
          <p className="mt-0.5 text-[12.5px] text-taupe">
            {formatDate(order.createdAt)}
            {showCustomer && ` · ${order.customer.fullName}`}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex items-center gap-2">
        {order.items.slice(0, 4).map((i) => (
          <div key={i.variantId} className="aspect-product w-12 overflow-hidden bg-linen">
            <img src={i.image} alt={i.name} width="48" height="60" loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
        {order.items.length > 4 && <span className="text-[12px] text-taupe">+{order.items.length - 4}</span>}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3.5 text-[13px]">
        <div className="space-y-1">
          <p className="text-taupe">
            {pluralize(count, 'item')} · {paymentMethodLabel(order)}
          </p>
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <div className="text-right">
          <p className="text-[15px] font-medium tabular-nums">{formatPrice(order.total)}</p>
          <span className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-espresso underline underline-offset-4">View details</span>
        </div>
      </div>
    </article>
  );
}

/** Vertical tracking timeline derived from the order's status history. */
export function OrderTimeline({ order }) {
  const reached = (status) => order.history.find((h) => h.status === status);
  const terminal = order.status === 'cancelled' || order.status === 'returned' ? order.history.findLast?.((h) => h.status === order.status) ?? order.history[order.history.length - 1] : null;
  const steps = FULFILLMENT_FLOW.map((status) => ({ status, event: reached(status) }));
  const lastReachedIndex = steps.reduce((acc, s, i) => (s.event ? i : acc), 0);
  const visible = order.status === 'cancelled' ? steps.filter((s) => s.event) : steps;

  return (
    <ol className="relative">
      {visible.map(({ status, event }, i) => {
        const done = Boolean(event);
        const current = done && i === lastReachedIndex && !terminal;
        return (
          <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
            {(i < visible.length - 1 || terminal) && <span aria-hidden className={cn('absolute left-[11px] top-6 h-[calc(100%-12px)] w-px', done && visible[i + 1]?.event ? 'bg-espresso' : 'bg-line-strong')} />}
            <span
              aria-hidden
              className={cn(
                'relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                done ? 'border-espresso bg-espresso text-ivory' : 'border-line-strong bg-porcelain text-line-strong',
                current && 'ring-4 ring-champagne-soft'
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Circle className="h-2 w-2 fill-current" />}
            </span>
            <div className="min-w-0">
              <p className={cn('text-[14px]', done ? 'font-medium' : 'text-taupe')}>
                {ORDER_STATUSES[status].label}
                {current && <span className="sr-only"> (current status)</span>}
              </p>
              {done ? (
                <p className="text-[12.5px] text-taupe">
                  {formatDateTime(event.at)}
                  {event.note && <span className="block text-espresso-soft">{event.note}</span>}
                </p>
              ) : (
                current === false && i === lastReachedIndex + 1 && <p className="text-[12.5px] text-taupe">{ORDER_STATUSES[status].description}</p>
              )}
            </div>
          </li>
        );
      })}
      {terminal && (
        <li className="relative flex gap-4">
          <span aria-hidden className="relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rosewood bg-rosewood text-white">
            {order.status === 'cancelled' ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <RotateCcw className="h-3 w-3" strokeWidth={2} />}
          </span>
          <div>
            <p className="text-[14px] font-medium">{ORDER_STATUSES[order.status].label}</p>
            <p className="text-[12.5px] text-taupe">
              {formatDateTime(terminal.at)}
              {terminal.note && <span className="block text-espresso-soft">{terminal.note}</span>}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}

export function OrderItemsList({ items, linkProducts = true }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((i) => (
        <li key={i.variantId} className="flex gap-4 py-4">
          <div className="aspect-product w-16 shrink-0 overflow-hidden bg-linen">
            <img src={i.image} alt="" width="64" height="80" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="flex min-w-0 flex-1 justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] leading-snug">{linkProducts && i.slug ? <Link to={`/product/${i.slug}`}>{i.name}</Link> : i.name}</p>
              {i.variantName && <p className="text-[12.5px] text-taupe">{i.variantName}</p>}
              <p className="text-[12.5px] text-taupe">
                {i.quantity} × {formatPrice(i.unitPrice)}
                {i.sku && <span className="ml-2 hidden sm:inline">· {i.sku}</span>}
              </p>
            </div>
            <p className="shrink-0 text-[14px] tabular-nums">{formatPrice(i.lineTotal)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotalsBlock({ order }) {
  const rows = [
    ['Subtotal', formatPrice(order.subtotal)],
    order.discount > 0 && [`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `−${formatPrice(order.discount)}`],
    ['Delivery', order.shippingFee ? formatPrice(order.shippingFee) : 'Complimentary'],
  ].filter(Boolean);
  const refunded = (order.refunds || []).reduce((s, r) => s + r.amount, 0);
  return (
    <dl className="space-y-2 text-[14px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between">
          <dt className="text-espresso-soft">{k}</dt>
          <dd className="tabular-nums">{v}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-line pt-3 text-[15.5px] font-medium">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatPrice(order.total)}</dd>
      </div>
      {refunded > 0 && (
        <div className="flex justify-between text-[13px] text-taupe">
          <dt>Refunded</dt>
          <dd className="tabular-nums">−{formatPrice(refunded)}</dd>
        </div>
      )}
    </dl>
  );
}

export function AddressBlock({ address, customer }) {
  return (
    <address className="space-y-0.5 text-[14px] not-italic leading-relaxed">
      {customer && <p className="font-medium">{customer.fullName}</p>}
      <p>
        {address.building}
        {address.floor && `, floor ${address.floor}`}
      </p>
      <p>{address.street}</p>
      <p>
        {address.city}, {address.district}
      </p>
      <p>{governorateName(address.governorate)}, Lebanon</p>
      {address.landmark && <p className="text-taupe">Near: {address.landmark}</p>}
      {address.instructions && <p className="text-taupe">“{address.instructions}”</p>}
      {customer && (
        <p className="pt-2 text-espresso-soft">
          {formatLebanesePhone(customer.phone)}
          <br />
          {customer.email}
        </p>
      )}
    </address>
  );
}
