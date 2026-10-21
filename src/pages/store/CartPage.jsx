import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react';
import { Button, EmptyState, ErrorState, Select } from '../../components/ui/index.js';
import { CartLineItem, CartLineSkeleton, CartNotices, CheckoutBlockers, FreeShippingProgress, OrderTotals, PromoCodeForm } from '../../components/cart/CartParts.jsx';
import { ProductRail, SectionHeader } from '../../components/home/Sections.jsx';
import { useCartQuote, useHome, useStoreSettings } from '../../hooks/queries.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useCartStore, selectCartCount } from '../../stores/cartStore.js';
import { GOVERNORATES } from '../../constants/lebanon.js';

export default function CartPage() {
  usePageMeta({ title: 'Your bag', noindex: true });
  const { data: quote, isLoading, error, refetch, isEmpty, isFetching } = useCartQuote();
  const count = useCartStore(selectCartCount);
  const governorate = useCartStore((s) => s.governorate);
  const setGovernorate = useCartStore((s) => s.setGovernorate);
  const { data: settings } = useStoreSettings();
  const { data: home } = useHome();

  if (isEmpty) {
    return (
      <div className="container-page pb-10">
        <EmptyState icon={ShoppingBag} title="Your bag is empty" description="Your bag is saved on this device, so anything you add will be here when you come back." action={<Button to="/shop">Continue shopping</Button>} />
        {home?.bestSellers?.length > 0 && (
          <section aria-labelledby="cart-best" className="mt-6">
            <SectionHeader title={<span id="cart-best">Most loved right now</span>} />
            <ProductRail products={home.bestSellers.slice(0, 4)} label="Bestsellers" />
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="container-page pb-10 pt-8 sm:pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[2.4rem] leading-tight sm:text-[3rem]">
          Your bag <span className="align-middle font-sans text-[15px] text-taupe">({count})</span>
        </h1>
        <Link to="/shop" className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] link-underline">
          <ArrowLeft aria-hidden className="rtl-flip h-3.5 w-3.5" /> Continue shopping
        </Link>
      </div>

      {error && !quote ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <section aria-label="Items in your bag">
            <div className="space-y-2">
              <CartNotices />
              <CheckoutBlockers quote={quote} />
            </div>
            <ul className="divide-y divide-line border-y border-line" aria-busy={isFetching}>
              {isLoading || !quote ? [1, 2, 3].map((i) => <CartLineSkeleton key={i} />) : quote.items.map((line) => <CartLineItem key={line.variantId} line={line} editable />)}
            </ul>
          </section>

          <aside aria-label="Order summary" className="lg:sticky lg:top-[150px] lg:self-start">
            <div className="space-y-6 border border-line bg-porcelain p-5 sm:p-7">
              <h2 className="font-display text-[1.5rem]">Summary</h2>
              <FreeShippingProgress quote={quote} />
              <div>
                <label htmlFor="ship-estimate" className="field-label">
                  Estimate delivery to
                </label>
                <Select id="ship-estimate" value={governorate ?? ''} onChange={(e) => setGovernorate(e.target.value || null)} placeholder="Choose your governorate">
                  {GOVERNORATES.filter((g) => settings?.shipping?.zones?.find((z) => z.governorate === g.id)?.enabled !== false).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
              <PromoCodeForm quote={quote} isFetching={isFetching} />
              <OrderTotals quote={quote} />
              <Button to={quote?.canCheckout ? '/checkout' : undefined} disabled={!quote?.canCheckout} size="lg" block aria-disabled={!quote?.canCheckout}>
                <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} /> Continue to checkout
              </Button>
              <p className="text-center text-[12.5px] leading-relaxed text-taupe">Pay cash on delivery. Stock is confirmed when you place your order — items in your bag are not reserved.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
