import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, Notice } from '../../components/ui/index.js';
import { PhoneInput } from '../../components/account/AddressFields.jsx';
import { OrderDetailView } from '../../components/order/OrderDetailView.jsx';
import { trackOrderSchema } from '../../lib/validation.js';
import { orderService } from '../../services/index.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function TrackOrderPage() {
  usePageMeta({ title: 'Track your order', description: 'Track a LUMA order with your order number and mobile number.' });
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(trackOrderSchema), defaultValues: { reference: params.get('reference') ?? '', phone: '' } });

  const onSubmit = async ({ reference, phone }) => {
    setError(null);
    try {
      setOrder(await orderService.track(reference, phone));
    } catch (e) {
      setOrder(null);
      setError(e.message);
    }
  };

  return (
    <div className="container-page pb-10 pt-10 sm:pt-14">
      <div className="max-w-xl">
        <h1 className="font-display text-[2.4rem] leading-tight sm:text-[3rem]">Track your order</h1>
        <p className="mt-3 text-[15px] text-espresso-soft">Enter the order number from your confirmation and the mobile number used at checkout.</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <Field label="Order number" error={errors.reference?.message}>
            <Input placeholder="LUMA-10248" autoCapitalize="characters" {...register('reference')} />
          </Field>
          <Field label="Mobile number" error={errors.phone?.message}>
            <PhoneInput {...register('phone')} />
          </Field>
          <Button type="submit" loading={isSubmitting} className="sm:mt-[26px] sm:min-h-[46px]">
            Track
          </Button>
        </form>
        {error && (
          <Notice tone="error" className="mt-6">
            {error}
          </Notice>
        )}
      </div>
      {order && (
        <section className="mt-14 border-t border-line pt-10" aria-label={`Order ${order.reference}`}>
          <h2 className="mb-6 font-display text-[2rem]">Order {order.reference}</h2>
          <OrderDetailView order={order} />
        </section>
      )}
    </div>
  );
}
