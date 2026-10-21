import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Lock, ShieldCheck, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Checkbox, EmptyState, Field, Input, Notice, RadioCard, Skeleton } from '../../components/ui/index.js';
import { AddressFields, PhoneInput } from '../../components/account/AddressFields.jsx';
import { OrderTotals, PromoCodeForm } from '../../components/cart/CartParts.jsx';
import { useCartQuote, useStoreSettings } from '../../hooks/queries.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { toast } from '../../stores/uiStores.js';
import { checkoutSchema } from '../../lib/validation.js';
import { orderService } from '../../services/index.js';
import { formatPrice } from '../../lib/money.js';
import { governorateName } from '../../constants/lebanon.js';
import { cn } from '../../lib/format.js';
import { IS_DEMO } from '../../config/env.js';

const localPhone = (p) => (p ? p.replace(/^\+961/, '0').replace(/^0(7|8)/, '$1') : '');

function Section({ step, title, children, aside }) {
  return (
    <section className="border-t border-line pt-8" aria-labelledby={`step-${step}`}>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 id={`step-${step}`} className="flex items-baseline gap-3 font-display text-[1.55rem]">
          <span className="font-sans text-[12px] tracking-[0.14em] text-taupe">0{step}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function SummaryItems({ quote }) {
  return (
    <ul className="divide-y divide-line">
      {quote.items.map((l) => (
        <li key={l.variantId} className={cn('flex items-center gap-4 py-3.5', l.status === 'unavailable' && 'opacity-60')}>
          <div className="relative aspect-product w-14 shrink-0 bg-linen">
            {l.image && <img src={l.image} alt="" width="56" height="70" className="h-full w-full object-cover" />}
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-espresso px-1 text-[10.5px] text-ivory">{l.quantity}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px]">{l.name}</p>
            {l.variantName && <p className="text-[12px] text-taupe">{l.variantName}</p>}
            {l.status === 'unavailable' && <p className="text-[12px] text-rosewood">No longer available</p>}
          </div>
          <p className="text-[13.5px] tabular-nums">{formatPrice(l.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

export default function CheckoutPage() {
  usePageMeta({ title: 'Checkout', noindex: true });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const lines = useCartStore((s) => s.lines);
  const couponCode = useCartStore((s) => s.couponCode);
  const clearCart = useCartStore((s) => s.clear);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const setStoredGovernorate = useCartStore((s) => s.setGovernorate);
  const storedGovernorate = useCartStore((s) => s.governorate);
  const { data: settings, isLoading: settingsLoading } = useStoreSettings();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(() => user?.addresses?.find((a) => a.isDefault)?.id ?? (user?.addresses?.length ? user.addresses[0].id : 'new'));
  // One idempotency key per attempt: a double click or network retry can never create two orders.
  const idempotencyKey = useRef(orderService.newIdempotencyKey());
  const placing = useRef(false);

  const defaultAddress = user?.addresses?.find((a) => a.id === selectedAddress);
  const paymentMethods = settings?.payments ?? {};
  const enabledGovernorates = settings?.shipping?.zones?.filter((z) => z.enabled).map((z) => z.governorate);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    reset,
    getValues,
    formState: { errors, isSubmitting, submitCount },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: localPhone(user?.phone),
      email: user?.email ?? '',
      governorate: defaultAddress?.governorate ?? storedGovernorate ?? '',
      district: defaultAddress?.district ?? '',
      city: defaultAddress?.city ?? '',
      street: defaultAddress?.street ?? '',
      building: defaultAddress?.building ?? '',
      floor: defaultAddress?.floor ?? '',
      landmark: defaultAddress?.landmark ?? '',
      instructions: defaultAddress?.instructions ?? '',
      paymentMethod: 'cod',
      saveAddress: false,
      acceptTerms: false,
    },
  });

  // Fill from a saved address when the shopper picks one.
  useEffect(() => {
    if (!user) return;
    const a = user.addresses?.find((x) => x.id === selectedAddress);
    const fields = ['governorate', 'district', 'city', 'street', 'building', 'floor', 'landmark', 'instructions'];
    const values = getValues();
    reset({ ...values, ...Object.fromEntries(fields.map((f) => [f, a ? a[f] ?? '' : f === 'governorate' ? values.governorate : ''])) }, { keepErrors: false });
  }, [selectedAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the first enabled payment method selected.
  useEffect(() => {
    const first = Object.keys(paymentMethods)[0];
    if (first && !paymentMethods[getValues('paymentMethod')]) setValue('paymentMethod', first);
  }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const governorate = useWatch({ control, name: 'governorate' });
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  useEffect(() => {
    if (governorate) setStoredGovernorate(governorate);
  }, [governorate, setStoredGovernorate]);

  const { data: quote, isLoading, isFetching, refetch, isEmpty } = useCartQuote({ governorate: governorate || undefined });

  // New attempt (new key) whenever the bag contents change.
  const linesKey = useMemo(() => JSON.stringify(lines) + couponCode, [lines, couponCode]);
  useEffect(() => {
    idempotencyKey.current = orderService.newIdempotencyKey();
  }, [linesKey]);

  useEffect(() => {
    if (submitCount > 0 && Object.keys(errors).length) {
      const first = Object.keys(errors)[0];
      try {
        setFocus(first);
      } catch {
        /* non-focusable field */
      }
    }
  }, [submitCount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isEmpty) {
    return <EmptyState icon={ShoppingBag} title="Your bag is empty" description="Add something to your bag to check out." action={<Button to="/shop">Browse the shop</Button>} />;
  }

  const onSubmit = async (values) => {
    if (placing.current) return;
    setServerError(null);
    const fresh = (await refetch()).data ?? quote;
    if (!fresh?.canCheckout) {
      setServerError({ title: 'Your bag has changed', body: 'Some items are no longer available in the quantity you chose. Please review your bag before placing your order.', link: true });
      return;
    }
    placing.current = true;
    try {
      const order = await orderService.placeOrder(
        {
          items: lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
          couponCode: couponCode || undefined,
          customer: values,
          expectedTotal: fresh.total,
        },
        idempotencyKey.current
      );
      try {
        sessionStorage.setItem('luma.lastOrder', JSON.stringify({ reference: order.reference, phone: order.customer.phone }));
      } catch {
        /* private mode */
      }
      queryClient.setQueryData(['order-confirmation', order.reference], order);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      clearCart();
      navigate(`/order/confirmation/${order.reference}`, { replace: true, state: { order } });
    } catch (e) {
      placing.current = false;
      if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => k !== 'couponCode' && setError(k, { message }));
      if (e.code === 'STOCK_CHANGED' || e.code === 'TOTAL_CHANGED') {
        refetch();
        setServerError({ title: e.code === 'STOCK_CHANGED' ? 'Your bag has changed' : 'Your total has changed', body: e.message, link: e.code === 'STOCK_CHANGED' });
      } else if (e.code === 'COUPON_INVALID') {
        removeCoupon();
        setServerError({ title: 'Promo code removed', body: e.message });
      } else {
        setServerError({ title: 'We could not place your order', body: e.message });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Your order was not placed', { description: e.message });
    }
  };

  const total = quote?.total ?? 0;
  const summary = quote ? (
    <div className="space-y-6">
      <SummaryItems quote={quote} />
      <PromoCodeForm quote={quote} isFetching={isFetching} />
      <OrderTotals quote={quote} />
    </div>
  ) : (
    <Skeleton className="h-64" />
  );

  return (
    <div className="container-page pb-10 pt-8 sm:pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[2.4rem] leading-tight sm:text-[3rem]">Checkout</h1>
        <p className="flex items-center gap-2 text-[12.5px] text-taupe">
          <ShieldCheck aria-hidden className="h-4 w-4 text-sage" strokeWidth={1.5} /> We never ask for card details.
        </p>
      </div>

      {/* Mobile summary toggle */}
      <div className="mb-8 border border-line bg-porcelain lg:hidden">
        <button type="button" onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} className="flex w-full items-center justify-between px-4 py-4 text-[14px]">
          <span className="flex items-center gap-2">
            {summaryOpen ? 'Hide' : 'Show'} order summary <ChevronDown aria-hidden className={cn('h-4 w-4 transition-transform', summaryOpen && 'rotate-180')} />
          </span>
          <span className="font-medium tabular-nums">{quote ? formatPrice(total) : '…'}</span>
        </button>
        <AnimatePresence initial={false}>
          {summaryOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="border-t border-line px-4 py-4">{summary}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-10" aria-describedby={serverError ? 'checkout-error' : undefined}>
          {serverError && (
            <div id="checkout-error">
              <Notice tone="error" title={serverError.title}>
                {serverError.body}{' '}
                {serverError.link && (
                  <Link to="/cart" className="link-underline">
                    Review your bag
                  </Link>
                )}
              </Notice>
            </div>
          )}

          <Section
            step={1}
            title="Contact"
            aside={
              !user && (
                <p className="text-[13px] text-taupe">
                  Have an account?{' '}
                  <Link to="/login" state={{ from: '/checkout' }} className="link-underline text-espresso">
                    Sign in
                  </Link>
                </p>
              )
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
                <Input autoComplete="name" {...register('fullName')} />
              </Field>
              <Field label="Mobile number" hint="Our team confirms every order by phone or WhatsApp." error={errors.phone?.message}>
                <PhoneInput {...register('phone')} />
              </Field>
              <Field label="Email" hint="For your order confirmation." error={errors.email?.message}>
                <Input type="email" autoComplete="email" {...register('email')} />
              </Field>
            </div>
            {!user && <p className="mt-4 text-[13px] text-taupe">You are checking out as a guest. You can track your order with your order number and phone.</p>}
          </Section>

          <Section step={2} title="Delivery address">
            {user?.addresses?.length > 0 && (
              <fieldset className="mb-6">
                <legend className="field-label">Saved addresses</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {user.addresses.map((a) => (
                    <RadioCard
                      key={a.id}
                      name="savedAddress"
                      value={a.id}
                      checked={selectedAddress === a.id}
                      onChange={() => setSelectedAddress(a.id)}
                      label={a.label || 'Address'}
                      description={`${a.building}, ${a.street}, ${a.city} — ${governorateName(a.governorate)}`}
                    />
                  ))}
                  <RadioCard name="savedAddress" value="new" checked={selectedAddress === 'new'} onChange={() => setSelectedAddress('new')} label="Use a new address" description="Enter a different delivery address." />
                </div>
              </fieldset>
            )}
            <AddressFields register={register} control={control} errors={errors} setValue={setValue} enabledGovernorates={enabledGovernorates} />
            {user && selectedAddress === 'new' && <Checkbox className="mt-4" label="Save this address to my account" {...register('saveAddress')} />}
            {quote?.shippingZone && (
              <p className="mt-5 border border-line bg-porcelain px-4 py-3 text-[13.5px]">
                Delivery to {governorateName(quote.shippingZone.governorate)}: <strong className="font-medium">{quote.shippingFee === 0 ? 'complimentary' : formatPrice(quote.shippingFee)}</strong>
                {quote.shippingZone.estimate && <span className="text-taupe"> · usually {quote.shippingZone.estimate} after confirmation</span>}
              </p>
            )}
          </Section>

          <Section step={3} title="Payment">
            {settingsLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <fieldset>
                <legend className="sr-only">Payment method</legend>
                <div className="space-y-2">
                  {Object.entries(paymentMethods).map(([key, m]) => (
                    <RadioCard key={key} value={key} {...register('paymentMethod')} label={m.label} description={m.description} aside={key === 'cod' ? <span className="text-[11px] uppercase tracking-[0.12em] text-sage">Most popular</span> : null} />
                  ))}
                </div>
                {errors.paymentMethod && <p className="field-error">{errors.paymentMethod.message}</p>}
                <p className="mt-4 text-[13px] text-taupe">
                  {paymentMethod === 'manual'
                    ? 'Your order will be marked “awaiting payment” until we confirm the transfer.'
                    : 'You pay when the courier hands you your order. Payment status will show as “awaiting payment” until delivery.'}
                </p>
              </fieldset>
            )}
          </Section>

          <div className="space-y-5 border-t border-line pt-8">
            <Checkbox
              label={
                <>
                  I have read the{' '}
                  <Link to="/pages/delivery" target="_blank" className="link-underline">
                    delivery
                  </Link>{' '}
                  and{' '}
                  <Link to="/pages/returns" target="_blank" className="link-underline">
                    returns
                  </Link>{' '}
                  policy.
                </>
              }
              error={errors.acceptTerms?.message}
              {...register('acceptTerms')}
            />
            {IS_DEMO && <Notice tone="info">Demo store: placing an order simulates the process. No real order is created and nothing will be delivered.</Notice>}
            <Button type="submit" size="lg" block loading={isSubmitting} disabled={isSubmitting || isLoading || !quote?.canCheckout}>
              <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
              {isSubmitting ? 'Placing your order…' : `Place order${quote ? ` · ${formatPrice(total)}` : ''}`}
            </Button>
            {quote && !quote.canCheckout && (
              <p className="text-center text-[13px] text-rosewood">
                Some items in your bag are unavailable.{' '}
                <Link to="/cart" className="link-underline">
                  Review your bag
                </Link>
              </p>
            )}
            {quote?.shippingFee == null && <p className="text-center text-[12.5px] text-taupe">Delivery fee is added once you choose your governorate.</p>}
          </div>
        </form>

        <aside aria-label="Order summary" className="hidden lg:block">
          <div className="sticky top-[150px] border border-line bg-porcelain p-7">
            <h2 className="mb-4 font-display text-[1.5rem]">Order summary</h2>
            {summary}
          </div>
        </aside>
      </div>
    </div>
  );
}
