import { Banknote, PackageCheck, Truck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button, ErrorState, Skeleton } from '../../components/ui/index.js';
import { CategoryRow, EditorialBanner, FeaturedCollection, Gallery, Newsletter, ProductRail, Reveal, SectionHeader, Testimonials } from '../../components/home/Sections.jsx';
import { useCategories, useHome, useStoreSettings } from '../../hooks/queries.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { formatPrice } from '../../lib/money.js';

function Hero({ hero }) {
  const reduce = useReducedMotion();
  const fade = (d) => (reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: d, ease: [0.22, 0.61, 0.36, 1] } });
  if (!hero)
    return (
      <div className="container-page grid gap-8 py-10 lg:grid-cols-2">
        <Skeleton className="h-[420px]" />
        <Skeleton className="aspect-[6/7]" />
      </div>
    );
  return (
    <section className="relative" aria-labelledby="hero-title">
      <div className="container-page grid items-center gap-8 pb-14 pt-6 sm:pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16 lg:pb-20 lg:pt-12">
        <div className="order-2 lg:order-1">
          <motion.p className="eyebrow mb-5" {...fade(0.05)}>
            {hero.eyebrow}
          </motion.p>
          <motion.h1 id="hero-title" className="text-balance font-display text-[2.6rem] leading-[1.02] xs:text-[2.9rem] sm:text-display-lg xl:text-display-xl" {...fade(0.12)}>
            {hero.title}
          </motion.h1>
          <motion.p className="mt-6 max-w-[34rem] text-[16px] leading-relaxed text-espresso-soft" {...fade(0.22)}>
            {hero.subtitle}
          </motion.p>
          <motion.div className="mt-9 flex flex-col gap-3 xs:flex-row" {...fade(0.3)}>
            <Button to={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
            </Button>
            <Button to={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </motion.div>
        </div>
        <motion.div className="order-1 lg:order-2" initial={reduce ? false : { opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}>
          <picture>
            <source media="(min-width: 1024px)" srcSet={hero.image} />
            <img src={hero.mobileImage || hero.image} alt="LUMA serum, gel cream and lip oil arranged on stone plinths in soft morning light" width="1200" height="1400" className="aspect-[4/5] w-full bg-linen object-cover lg:aspect-[6/7]" fetchpriority="high" />
          </picture>
        </motion.div>
      </div>
    </section>
  );
}

function Promises() {
  const { data } = useStoreSettings();
  const threshold = data?.shipping?.freeShippingThreshold;
  const items = [
    [Banknote, 'Cash on delivery', 'Pay the courier in USD when your order arrives.'],
    [Truck, 'Delivery across Lebanon', threshold != null ? `Complimentary on orders over ${formatPrice(threshold).replace('.00', '')}.` : 'Fees shown at checkout by region.'],
    [PackageCheck, 'Chosen by hand', 'Every product is selected and checked by our team in Beirut.'],
  ];
  return (
    <section aria-label="Our promises" className="border-y border-line bg-porcelain">
      <ul className="container-page grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map(([Icon, title, text]) => (
          <li key={title} className="flex items-start gap-4 py-5 sm:px-6 sm:py-7 first:sm:pl-0">
            <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-bronze" strokeWidth={1.3} />
            <div>
              <p className="text-[14px] font-medium">{title}</p>
              <p className="text-[13px] text-taupe">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BrandStory() {
  return (
    <section className="container-page" aria-labelledby="story-title">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <img src="/images/editorial/story.svg" alt="A night cream and facial oil on travertine plinths" width="900" height="1200" loading="lazy" className="aspect-[3/4] w-full bg-linen object-cover" />
        </Reveal>
        <Reveal delay={0.1} className="lg:pr-10">
          <p className="eyebrow mb-4">Our story</p>
          <h2 id="story-title" className="font-display text-[2.2rem] leading-[1.06] sm:text-[3rem]">
            Fewer products, chosen slowly.
          </h2>
          <div className="mt-6 space-y-4 text-[15.5px] leading-relaxed text-espresso-soft">
            <p>
              LUMA began in a small studio in Achrafieh with a simple idea: a beauty shelf should feel calm. We test every texture ourselves, read every ingredient list, and only stock what we would happily
              use every day.
            </p>
            <p>Alongside our own LUMA Atelier formulas, we work with a handful of independent houses — including Noor &amp; Co., who make their balms and masks in small batches here in Lebanon.</p>
          </div>
          <Link to="/pages/about" className="mt-8 inline-block text-[12px] font-medium uppercase tracking-[0.16em] link-underline">
            Read our story
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  usePageMeta({
    description: 'LUMA Beauty — considered skincare, hydrogel eye patches, serums and beauty tools, delivered across Lebanon with cash on delivery.',
    image: '/images/editorial/hero-main.svg',
  });
  const { data, isLoading, error, refetch } = useHome();
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: settings } = useStoreSettings();

  if (error) return <ErrorState error={error} onRetry={refetch} className="py-32" />;

  const [eyeBanner, serumBanner] = data?.promoBanners ?? [];
  const skincare = data?.featuredCollections?.find((c) => c.key === 'skincare');
  const eye = data?.featuredCollections?.find((c) => c.key === 'eye-care');

  return (
    <div className="space-y-20 sm:space-y-28">
      <div>
        <Hero hero={data?.hero} />
        <Promises />
      </div>

      <CategoryRow categories={categories} loading={catLoading} />

      <section className="container-page" aria-labelledby="best-title">
        <SectionHeader eyebrow="Most loved" title={<span id="best-title">Bestsellers</span>} link={{ to: '/shop?bestseller=true&sort=popular', label: 'View all' }} />
        <ProductRail products={data?.bestSellers ?? []} loading={isLoading} label="Bestsellers" />
      </section>

      <EditorialBanner banner={eyeBanner} />

      <FeaturedCollection collection={skincare} image="/images/editorial/category-serums.svg" />

      <section className="container-page" aria-labelledby="new-title">
        <SectionHeader eyebrow="Just arrived" title={<span id="new-title">New arrivals</span>} link={{ to: '/shop?isNew=true&sort=newest', label: 'View all' }} />
        <ProductRail products={data?.newArrivals ?? []} loading={isLoading} label="New arrivals" />
      </section>

      <FeaturedCollection collection={eye} image="/images/editorial/category-eye-care.svg" reverse />

      <EditorialBanner banner={serumBanner} align="right" />

      <BrandStory />

      <Testimonials reviews={data?.reviews} />

      <Gallery images={data?.gallery} handle={settings?.store?.instagramHandle} url={settings?.store?.instagramUrl} />

      <Newsletter />
    </div>
  );
}
