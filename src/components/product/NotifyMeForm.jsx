import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BellRing, Check } from 'lucide-react';
import { notifyMeSchema } from '../../lib/validation.js';
import { catalogService } from '../../services/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Button, Field, Input } from '../ui/index.js';

/** Collects a back-in-stock request for a specific variant. */
export function NotifyMeForm({ product, variant, compact = false }) {
  const user = useAuthStore((s) => s.user);
  const [done, setDone] = useState(null);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(notifyMeSchema), defaultValues: { email: user?.email ?? '' } });

  if (variant?.discontinued) {
    return <p className="border border-line bg-linen px-4 py-3 text-[13.5px] text-espresso-soft">This option has been discontinued and will not be restocked.</p>;
  }

  const onSubmit = async ({ email }) => {
    setServerError(null);
    try {
      const res = await catalogService.requestRestock({ productId: product.id, variantId: variant.id, email });
      setDone(res.alreadyRequested ? 'already' : 'new');
    } catch (e) {
      setServerError(e.message);
    }
  };

  if (done) {
    return (
      <div role="status" className="flex items-start gap-3 border border-sage/25 bg-sage-soft px-4 py-3.5 text-[13.5px]">
        <Check aria-hidden className="mt-0.5 h-4 w-4 text-sage" />
        <p>
          {done === 'already' ? 'You are already on the list for this item.' : 'Thank you — we will email you once when this is back in stock.'}
          <span className="block text-taupe">No marketing emails, just this one notification.</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="border border-line bg-porcelain p-4">
      <p className="mb-3 flex items-center gap-2 text-[14px] font-medium">
        <BellRing aria-hidden className="h-4 w-4 text-bronze" strokeWidth={1.5} />
        Notify me when available
      </p>
      {!compact && <p className="-mt-1.5 mb-3 text-[13px] text-taupe">Leave your email and we will let you know as soon as {variant?.name !== 'Default' ? `“${variant?.name}”` : 'it'} is restocked.</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Field label="Email address" labelHidden error={errors.email?.message || serverError} className="flex-1">
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
        </Field>
        <Button type="submit" loading={isSubmitting} className="sm:min-h-[46px]">
          Notify me
        </Button>
      </div>
    </form>
  );
}
