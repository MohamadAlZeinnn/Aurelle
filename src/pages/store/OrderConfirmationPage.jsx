import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, MessageCircle, PhoneCall, Truck, Banknote } from 'lucide-react';
import { Button, EmptyState, Notice, Skeleton } from '../../components/ui/index.js';
import { OrderItemsList, OrderTotalsBlock, AddressBlock, PaymentStatusBadge, OrderStatusBadge, paymentMethodLabel } from '../../components/order/OrderParts.jsx';
import { orderService } from '../../services/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { IS_DEMO, whatsappLink } from '../../config/env.js';
import { formatPrice } from '../../lib/money.js';
import { formatLebanesePhone } from '../../lib/phone.js';

function readLastOrder() {
  try {
    return JSON.parse(sessionStorage.getItem('luma.lastOrder') || 'null');
  } catch {
    return null;
  }
}

export default function OrderConfirmationPage() {
  const { reference } = useParams();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  usePageMeta({ title: 'Order confirmed', noindex: true });
  const last = readLastOrder();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-confirmation', reference],
    queryFn: () => (user ? orderService.myOrder(reference).catch(() => orderService.track(reference, last?.phone)) : orderService.track(reference, last?.phone)),
    initialData: location.state?.order,
    enabled: Boolean(location.state?.order || user || (last?.reference === reference && last?.phone)),
    retry: false,
  });

  if (isLoading) return <Skeleton className="container-page my-16 h-96" />;
  if (!order)
    return (
      <EmptyState
        title="We can’t show this order here"
        description="For your privacy, order details are only shown on the device that placed the order or in your account. You can still track it with your order number and phone."
        action={<Button to={`/track-order?reference=${encodeURIComponent(reference)}`}>Track your order</Button>}
      />
    );

  const wa = whatsappLink(`Hello LUMA, I have a question about order ${order.reference}.`);
  const firstName = order.customer.fullName.split(' ')[0];
  const steps = [
    [PhoneCall, 'We confirm by phone', `Our team will call or message you on ${formatLebanesePhone(order.customer.phone)} to confirm your order and address.`],
    [Truck, 'We prepare and deliver', order.shippingZone?.estimate ? `Delivery to your region usually takes ${order.shippingZone.estimate} after confirmation.` : 'We will let you know the delivery day when we confirm your order.'],
    [Banknote, order.paymentMethod === 'cod' ? 'Pay on delivery' : 'Complete your transfer', order.paymentMethod === 'cod' ? `Please have ${formatPrice(order.total)} ready for the courier.` : 'We will send the transfer details when we confirm your order.'],
  ];

  return (
    <div className="container-page max-w-5xl pb-10 pt-10 sm:pt-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-sage text-ivory">
          <Check aria-hidden className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <p className="eyebrow">Thank you, {firstName}</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-tight sm:text-[3.25rem]">Your order has been received</h1>
        <p className="mt-4 text-[15px] text-espresso-soft">
          Order number <strong className="font-medium tracking-[0.06em] text-espresso">{order.reference}</strong>
          {' · '}we’ll send updates to {order.customer.email}.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </motion.div>

      {IS_DEMO && (
        <Notice tone="info" className="mx-auto mt-8 max-w-2xl">
          Demo mode: this order is simulated and stored in your browser only. No email was sent and nothing will be delivered.
        </Notice>
      )}

      <ol className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-3">
        {steps.map(([Icon, title, text], i) => (
          <li key={title} className="bg-porcelain p-6">
            <p className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-taupe">
              <Icon aria-hidden className="h-4 w-4 text-bronze" strokeWidth={1.4} /> Step {i + 1}
            </p>
            <p className="mt-3 text-[15px] font-medium">{title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-espresso-soft">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="conf-items">
          <h2 id="conf-items" className="mb-2 font-display text-[1.5rem]">
            Order summary
          </h2>
          <OrderItemsList items={order.items} linkProducts={false} />
          <div className="border-t border-line pt-5">
            <OrderTotalsBlock order={order} />
          </div>
        </section>
        <aside className="space-y-8">
          <section>
            <h2 className="eyebrow mb-3">Delivery to</h2>
            <AddressBlock address={order.shippingAddress} customer={order.customer} />
          </section>
          <section>
            <h2 className="eyebrow mb-3">Payment</h2>
            <p className="text-[14px]">{paymentMethodLabel(order)}</p>
          </section>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13.5px] link-underline">
              <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={1.4} /> Questions? Message us on WhatsApp
            </a>
          )}
        </aside>
      </div>

      <div className="mt-14 flex flex-col items-center gap-3 border-t border-line pt-10 sm:flex-row sm:justify-center">
        <Button to="/shop">Continue shopping</Button>
        {user ? (
          <Button to={`/account/orders/${order.reference}`} variant="secondary">
            View in your account
          </Button>
        ) : (
          <Button to={`/track-order?reference=${order.reference}`} variant="secondary">
            Track this order
          </Button>
        )}
      </div>
      {!user && (
        <p className="mt-6 text-center text-[13.5px] text-taupe">
          Want to see all your orders in one place?{' '}
          <Link to="/register" className="link-underline text-espresso">
            Create an account
          </Link>{' '}
          with the same email.
        </p>
      )}
    </div>
  );
}
