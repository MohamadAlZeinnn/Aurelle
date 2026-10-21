import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Drawer, Button, EmptyState, ErrorState } from '../ui/index.js';
import { useUiStore } from '../../stores/uiStores.js';
import { useCartStore, selectCartCount } from '../../stores/cartStore.js';
import { useCartQuote } from '../../hooks/queries.js';
import { CartLineItem, CartLineSkeleton, CartNotices, CheckoutBlockers, FreeShippingProgress, OrderTotals } from './CartParts.jsx';

export function CartDrawer() {
  const open = useUiStore((s) => s.cartOpen);
  const close = useUiStore((s) => s.closeCart);
  const count = useCartStore(selectCartCount);
  const navigate = useNavigate();
  const { data: quote, isLoading, error, refetch, isEmpty, isFetching } = useCartQuote();

  const go = (path) => {
    close();
    navigate(path);
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      title={
        <>
          Your bag{' '}
          {count > 0 && (
            <span className="ml-1 align-middle font-sans text-[13px] text-taupe">
              ({count} {count === 1 ? 'item' : 'items'})
            </span>
          )}
        </>
      }
      footer={
        !isEmpty && quote ? (
          <div className="space-y-4">
            <CheckoutBlockers quote={quote} />
            <OrderTotals quote={quote} showEstimate={false} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="quiet" onClick={() => go('/cart')}>
                View bag
              </Button>
              <Button onClick={() => go('/checkout')} disabled={!quote.canCheckout || isFetching}>
                Checkout
              </Button>
            </div>
            <p className="text-center text-[12px] text-taupe">Cash on delivery available across Lebanon.</p>
          </div>
        ) : null
      }
    >
      {isEmpty ? (
        <EmptyState
          compact
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Find something you’ll reach for every morning."
          action={
            <Button variant="secondary" onClick={() => go('/shop')}>
              Continue shopping
            </Button>
          }
        />
      ) : error && !quote ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="px-5">
          <FreeShippingProgress quote={quote} className="border-b border-line py-4" />
          <div className="pt-4">
            <CartNotices />
          </div>
          <ul className="divide-y divide-line" aria-busy={isFetching}>
            {isLoading || !quote ? [1, 2].map((i) => <CartLineSkeleton key={i} />) : quote.items.map((line) => <CartLineItem key={line.variantId} line={line} onNavigate={close} />)}
          </ul>
        </div>
      )}
    </Drawer>
  );
}
