import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Star } from 'lucide-react';
import { Button, Field, Input, Notice, Skeleton, Stars, Textarea } from '../ui/index.js';
import { useReviews } from '../../hooks/queries.js';
import { useAuthStore } from '../../stores/authStore.js';
import { reviewSchema } from '../../lib/validation.js';
import { catalogService } from '../../services/index.js';
import { formatDate, cn } from '../../lib/format.js';
import { IS_DEMO } from '../../config/env.js';

function StarInput({ value, onChange, error }) {
  const [hover, setHover] = useState(0);
  return (
    <fieldset>
      <legend className="field-label">Your rating</legend>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
            <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
            <Star aria-hidden className={cn('h-6 w-6 text-bronze transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-bronze', (hover || value) >= n ? 'fill-bronze' : '')} strokeWidth={1.2} />
            <span className="sr-only">
              {n} star{n > 1 ? 's' : ''}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

function ReviewForm({ productId, onDone }) {
  const qc = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0, title: '', body: '' } });
  const onSubmit = async (values) => {
    try {
      await catalogService.submitReview(productId, values);
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      onDone();
    } catch (e) {
      setError('root', { message: e.message });
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 border border-line bg-porcelain p-5 sm:p-6">
      <Controller name="rating" control={control} render={({ field }) => <StarInput value={field.value} onChange={field.onChange} error={errors.rating?.message} />} />
      <Field label="Title" error={errors.title?.message}>
        <Input {...register('title')} maxLength={80} />
      </Field>
      <Field label="Your review" hint="Share texture, how you use it and how it fits your routine." error={errors.body?.message}>
        <Textarea {...register('body')} rows={5} maxLength={1200} />
      </Field>
      {errors.root && <Notice tone="error">{errors.root.message}</Notice>}
      <Button type="submit" loading={isSubmitting}>
        Submit review
      </Button>
    </form>
  );
}

export function ProductReviews({ product }) {
  const { data, isLoading } = useReviews(product.id);
  const user = useAuthStore((s) => s.user);
  const [writing, setWriting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const total = data?.items.length ?? 0;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-40">
      <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
        <div>
          <h2 id="reviews-heading" className="section-title">
            Reviews
          </h2>
          {isLoading ? (
            <Skeleton className="mt-6 h-32" />
          ) : total ? (
            <div className="mt-5">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-[3rem] leading-none">{product.rating.average?.toFixed(1)}</span>
                <span className="text-taupe">/ 5</span>
              </p>
              <Stars value={product.rating.average} size={16} className="mt-2" />
              <p className="mt-1 text-[13px] text-taupe">
                Based on {total} review{total === 1 ? '' : 's'}
              </p>
              <ul className="mt-5 space-y-1.5" aria-label="Rating distribution">
                {data.distribution.map((d) => (
                  <li key={d.star} className="flex items-center gap-3 text-[12.5px]">
                    <span className="w-10 text-taupe">{d.star} star</span>
                    <span className="h-1 flex-1 bg-line">
                      <span className="block h-full bg-bronze" style={{ width: `${(d.count / total) * 100}%` }} />
                    </span>
                    <span className="w-5 text-right tabular-nums text-taupe">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-[14px] text-taupe">No reviews yet. We only show reviews from real customers, so this space fills slowly.</p>
          )}
          <div className="mt-6">
            {submitted ? (
              <p role="status" className="flex items-start gap-2 text-[13.5px]">
                <Check aria-hidden className="mt-0.5 h-4 w-4 text-sage" /> Thank you — your review will appear once our team has checked it.
              </p>
            ) : user ? (
              !writing && (
                <Button variant="secondary" size="sm" onClick={() => setWriting(true)}>
                  Write a review
                </Button>
              )
            ) : (
              <p className="text-[13px] text-taupe">
                <Link to="/login" state={{ from: `/product/${product.slug}#reviews` }} className="link-underline text-espresso">
                  Sign in
                </Link>{' '}
                to write a review.
              </p>
            )}
          </div>
          {IS_DEMO && total > 0 && <p className="mt-6 text-[12px] text-taupe">Demo mode: reviews shown are sample content.</p>}
        </div>

        <div>
          {writing && !submitted && (
            <div className="mb-8">
              <ReviewForm
                productId={product.id}
                onDone={() => {
                  setWriting(false);
                  setSubmitted(true);
                }}
              />
            </div>
          )}
          <ul className="divide-y divide-line border-t border-line">
            {data?.items.map((r) => (
              <li key={r.id} className="py-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars value={r.rating} />
                  <p className="text-[12.5px] text-taupe">{formatDate(r.createdAt)}</p>
                </div>
                <p className="sr-only">Rated {r.rating} out of 5</p>
                <h3 className="mt-3 font-sans text-[15px] font-medium">{r.title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-espresso-soft">{r.body}</p>
                <p className="mt-3 text-[12.5px]">
                  {r.author}
                  {r.verifiedPurchase && (
                    <span className="ml-2 inline-flex items-center gap-1 text-sage">
                      <Check aria-hidden className="h-3 w-3" /> Verified purchase
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
