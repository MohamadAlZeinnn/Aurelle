import { OrderItemsList, OrderStatusBadge, OrderTimeline, OrderTotalsBlock, AddressBlock, PaymentStatusBadge, paymentMethodLabel } from './OrderParts.jsx';
import { formatDateTime } from '../../lib/format.js';
import { ORDER_STATUSES } from '../../constants/orders.js';

/** Customer-facing order detail (account & guest tracking). */
export function OrderDetailView({ order, actions }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <div className="space-y-10">
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
          <span className="text-[13px] text-taupe">Placed {formatDateTime(order.createdAt)}</span>
        </div>
        <p className="-mt-6 text-[14.5px] text-espresso-soft">{ORDER_STATUSES[order.status]?.description}</p>
        <section aria-labelledby="items-h">
          <h2 id="items-h" className="mb-2 font-display text-[1.4rem]">
            Items
          </h2>
          <OrderItemsList items={order.items} />
          <div className="mt-4 border-t border-line pt-5">
            <OrderTotalsBlock order={order} />
          </div>
        </section>
        {actions}
      </div>
      <aside className="space-y-8">
        <section aria-labelledby="track-h" className="border border-line bg-porcelain p-6">
          <h2 id="track-h" className="mb-5 font-display text-[1.3rem]">
            Tracking
          </h2>
          <OrderTimeline order={order} />
          {order.shippingZone?.estimate && !['delivered', 'cancelled', 'returned'].includes(order.status) && (
            <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-taupe">Typical delivery time to this region: {order.shippingZone.estimate} after confirmation.</p>
          )}
        </section>
        <section aria-labelledby="ship-h">
          <h2 id="ship-h" className="eyebrow mb-3">
            Delivery to
          </h2>
          <AddressBlock address={order.shippingAddress} customer={order.customer} />
        </section>
        <section aria-labelledby="pay-h">
          <h2 id="pay-h" className="eyebrow mb-3">
            Payment
          </h2>
          <p className="text-[14px]">{paymentMethodLabel(order)}</p>
        </section>
      </aside>
    </div>
  );
}
