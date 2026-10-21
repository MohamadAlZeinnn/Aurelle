import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Check, Instagram } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductCard, ProductCardSkeleton } from '../product/ProductCard.jsx';
import { Button, Field, Input, Stars } from '../ui/index.js';
import { newsletterSchema } from '../../lib/validation.js';
import { catalogService } from '../../services/index.js';
import { formatDate, cn } from '../../lib/format.js';
import { IS_DEMO } from '../../config/env.js';

export function Reveal({ children, className, delay = 0, as = 'div' }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({ eyebrow, title, link, description, className, align = 'split' }) {
  return (
    <div className={cn('mb-8 flex flex-col gap-3 sm:mb-10', align === 'split' ? 'sm:flex-row sm:items-end sm:justify-between' : 'items-center text-center', className)}>
      <div className={cn(align !== 'split' && 'max-w-xl')}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="section-title text-balance">{title}</h2>
        {description && <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-espresso-soft">{description}</p>}
      </div>
      {link && (
        <Link to={link.to} className="inline-flex shrink-0 items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] link-underline">
          {link.label} <ArrowRight aria-hidden className="rtl-flip h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Horizontal rail on small screens, four-up grid on desktop. */
export function ProductRail({ products, loading, label }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const items = loading ? Array.from({ length: 4 }, (_, i) => ({ id: `s${i}` })) : products;
  return (
    <div className="relative">
      <div ref={ref} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0" aria-label={label} role="list">
        {items.map((p, i) => (
          <div key={p.id} role="listitem" className="w-[62vw] shrink-0 snap-start xs:w-[46vw] sm:w-[36vw] lg:w-auto lg:[&:nth-child(n+5)]:hidden">
            {loading ? <ProductCardSkeleton /> : <ProductCard product={p} eager={i < 2} />}
          </div>
        ))}
      </div>
      {!loading && products.length > 2 && (
        <div className="mt-6 flex justify-end gap-1 lg:hidden">
          <button type="button" onClick={() => scroll(-1)} className="icon-btn border border-line" aria-label={`Scroll ${label} back`}>
            <ChevronLeft className="rtl-flip h-4 w-4" strokeWidth={1.4} />
          </button>
          <button type="button" onClick={() => scroll(1)} className="icon-btn border border-line" aria-label={`Scroll ${label} forward`}>
            <ChevronRight className="rtl-flip h-4 w-4" strokeWidth={1.4} />
          </button>
        </div>
      )}
    </div>
  );
}

export function EditorialBanner({ banner, align = 'left' }) {
  if (!banner) return null;
  return (
    <section className="container-page" aria-labelledby={`banner-${banner.id}`}>
      <div className="relative overflow-hidden bg-blush-soft">
        <img src={banner.image} alt="" width="1600" height="900" loading="lazy" className="aspect-[4/5] w-full object-cover sm:aspect-[16/8] lg:aspect-banner" />
        <div className={cn('absolute inset-0 flex items-end p-6 sm:items-center sm:p-12 lg:p-20', align === 'right' && 'sm:justify-end')}>
          <Reveal className="max-w-md bg-ivory/90 p-6 backdrop-blur-sm sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
            <p className="eyebrow mb-3">{banner.eyebrow}</p>
            <h2 id={`banner-${banner.id}`} className="font-display text-[2rem] leading-[1.05] sm:text-[2.75rem] lg:text-[3.25rem]">
              {banner.title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-espresso-soft">{banner.body}</p>
            <Button to={banner.cta.href} className="mt-7">
              {banner.cta.label}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function FeaturedCollection({ collection, image, reverse = false }) {
  if (!collection) return null;
  return (
    <section className="container-page" aria-labelledby={`fc-${collection.id}`}>
      <div className={cn('grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14', reverse && 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
        <Reveal className={cn('flex flex-col', reverse && 'lg:order-2')}>
          <div className="relative overflow-hidden bg-linen">
            <img src={image} alt="" width="800" height="1000" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </div>
          <div className="mt-6">
            <p className="eyebrow mb-3">{collection.eyebrow}</p>
            <h2 id={`fc-${collection.id}`} className="section-title">
              {collection.title}
            </h2>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-espresso-soft">{collection.description}</p>
          </div>
        </Reveal>
        <div className={cn('grid grid-cols-2 gap-x-3 gap-y-10 self-center sm:gap-x-5', reverse && 'lg:order-1')}>
          {collection.products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryRow({ categories, loading }) {
  const ref = useRef(null);
  return (
    <section className="container-page" aria-labelledby="cat-title">
      <SectionHeader eyebrow="Browse" title={<span id="cat-title">Shop by category</span>} link={{ to: '/shop', label: 'Shop all' }} />
      <ul ref={ref} className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:-mx-6 sm:gap-4 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-7 lg:gap-4 lg:px-0">
        {(loading ? Array.from({ length: 7 }, (_, i) => ({ id: i })) : categories).map((c) => (
          <li key={c.id} className="w-[40vw] shrink-0 snap-start sm:w-[26vw] lg:w-auto">
            {loading ? (
              <div className="skeleton aspect-[4/5]" />
            ) : (
              <Link to={`/shop/${c.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden bg-linen">
                  <img src={c.image} alt="" width="400" height="500" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-[1.04]" />
                </div>
                <p className="mt-3 text-[14px]">{c.name}</p>
                <p className="text-[12px] text-taupe">{c.productCount} products</p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Testimonials({ reviews }) {
  if (!reviews?.length) return null;
  return (
    <section className="bg-blush-soft/60 py-20 sm:py-24" aria-labelledby="reviews-title">
      <div className="container-page">
        <SectionHeader align="center" eyebrow="From our customers" title={<span id="reviews-title">Kind words, verified orders</span>} description={IS_DEMO ? 'Sample reviews shown in demo mode. Live reviews are moderated and marked when linked to a delivered order.' : 'Reviews are moderated and marked when linked to a delivered order.'} />
        <ul className="grid gap-5 md:grid-cols-3">
          {reviews.slice(0, 3).map((r, i) => (
            <Reveal as="li" key={r.id} delay={i * 0.08} className="flex h-full flex-col bg-ivory p-7">
                <Stars value={r.rating} />
                <p className="sr-only">Rated {r.rating} out of 5</p>
                <h3 className="mt-4 font-display text-[1.3rem] leading-snug">“{r.title}”</h3>
                <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-espresso-soft">{r.body}</p>
                <div className="mt-6 border-t border-line pt-4 text-[12.5px]">
                  <p className="font-medium">
                    {r.author}
                    {r.verifiedPurchase && (
                      <span className="ml-2 inline-flex items-center gap-1 font-normal text-sage">
                        <Check aria-hidden className="h-3 w-3" /> Verified purchase
                      </span>
                    )}
                  </p>
                  <p className="text-taupe">
                    on{' '}
                    <Link to={`/product/${r.product?.slug}`} className="link-underline">
                      {r.product?.name}
                    </Link>{' '}
                    · {formatDate(r.createdAt, { year: undefined })}
                  </p>
                </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Gallery({ images, handle, url }) {
  if (!images?.length) return null;
  return (
    <section className="container-page" aria-labelledby="gallery-title">
      <SectionHeader eyebrow="Inspiration" title={<span id="gallery-title">From the studio</span>} link={url ? { to: '/pages/about', label: 'Our story' } : null} />
      <ul className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-6">
        {images.map((src, i) => (
          <li key={src} className="group relative aspect-square overflow-hidden bg-linen">
            <img src={src} alt="" width="400" height="400" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-[1.05]" />
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-espresso/0 text-ivory opacity-0 transition-all group-hover:bg-espresso/25 group-hover:opacity-100 focus-visible:bg-espresso/25 focus-visible:opacity-100" aria-label={`Open ${handle} on Instagram, image ${i + 1} (new tab)`}>
                <Instagram aria-hidden className="h-6 w-6" strokeWidth={1.3} />
              </a>
            )}
          </li>
        ))}
      </ul>
      {url && (
        <p className="mt-5 text-center text-[13.5px] text-taupe">
          Follow{' '}
          <a href={url} target="_blank" rel="noopener noreferrer" className="link-underline text-espresso">
            {handle}
          </a>{' '}
          for new arrivals and rituals.
        </p>
      )}
    </section>
  );
}

export function Newsletter() {
  const [state, setState] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(newsletterSchema) });
  const onSubmit = async ({ email }) => {
    try {
      const res = await catalogService.subscribeNewsletter(email);
      setState(res.alreadySubscribed ? 'already' : 'done');
    } catch (e) {
      setError('email', { message: e.message });
    }
  };
  return (
    <section className="container-page" aria-labelledby="nl-title">
      <div className="grid items-center gap-8 border-y border-line py-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow mb-3">The LUMA letter</p>
          <h2 id="nl-title" className="section-title">
            New arrivals and quiet rituals, once a month.
          </h2>
          <p className="mt-3 text-[14.5px] text-espresso-soft">No daily emails, no pressure. Unsubscribe in one click whenever you like.</p>
        </div>
        {state ? (
          <p role="status" className="flex items-center gap-3 text-[15px]">
            <Check aria-hidden className="h-5 w-5 text-sage" />
            {state === 'already' ? 'You are already on our list — thank you.' : 'Thank you for subscribing. Your first letter arrives next month.'}
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Field label="Email address" labelHidden error={errors.email?.message} className="flex-1">
              <Input type="email" autoComplete="email" placeholder="Your email address" {...register('email')} />
            </Field>
            <Button type="submit" loading={isSubmitting} className="sm:min-h-[46px]">
              Subscribe
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
