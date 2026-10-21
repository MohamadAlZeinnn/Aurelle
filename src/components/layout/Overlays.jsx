import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Heart, MessageCircle, Package, Search, User, X } from 'lucide-react';
import { Drawer, Accordion, Spinner } from '../ui/index.js';
import { useUiStore } from '../../stores/uiStores.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useCategories, useProducts } from '../../hooks/queries.js';
import { useDebounce, useFocusTrap, useScrollLock } from '../../hooks/useUtils.js';
import { formatPrice } from '../../lib/money.js';
import { whatsappLink } from '../../config/env.js';

export function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNav);
  const { data: categories = [] } = useCategories();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const close = () => setOpen(false);
  useEffect(() => close(), [location.pathname, location.search]); // eslint-disable-line react-hooks/exhaustive-deps
  const wa = whatsappLink('Hello LUMA, I have a question about an order.');

  return (
    <Drawer open={open} onClose={close} title="Menu" side="left" widthClass="max-w-[360px]">
      <nav aria-label="Mobile" className="px-5 pb-8">
        <Link to="/shop" className="flex items-center justify-between border-b border-line py-4 font-display text-[1.35rem]">
          Shop all <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.4} />
        </Link>
        <Accordion
          className="border-t-0"
          items={categories.map((c) => ({
            key: c.id,
            title: <span className="font-display text-[1.2rem] font-normal">{c.name}</span>,
            content: (
              <ul className="space-y-3 pl-1">
                <li>
                  <Link to={`/shop/${c.slug}`} className="text-[14px] font-medium">
                    All {c.name.toLowerCase()}
                  </Link>
                </li>
                {c.subcategories.map((s) => (
                  <li key={s.id}>
                    <Link to={`/shop/${c.slug}?subcategory=${s.slug}`} className="text-[14px] text-espresso-soft">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ),
          }))}
        />
        <Link to="/shop?onSale=true" className="block border-b border-line py-4 font-display text-[1.2rem] text-rosewood">
          Offers
        </Link>
        <ul className="mt-6 space-y-1 text-[14px]">
          <li>
            <Link to={user ? '/account' : '/login'} className="flex items-center gap-3 py-2.5">
              <User aria-hidden className="h-4 w-4" strokeWidth={1.4} /> {user ? `Hello, ${user.fullName.split(' ')[0]}` : 'Sign in or create account'}
            </Link>
          </li>
          <li>
            <Link to="/wishlist" className="flex items-center gap-3 py-2.5">
              <Heart aria-hidden className="h-4 w-4" strokeWidth={1.4} /> Wishlist
            </Link>
          </li>
          <li>
            <Link to="/track-order" className="flex items-center gap-3 py-2.5">
              <Package aria-hidden className="h-4 w-4" strokeWidth={1.4} /> Track an order
            </Link>
          </li>
          {wa && (
            <li>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2.5">
                <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={1.4} /> Chat with us on WhatsApp
              </a>
            </li>
          )}
          {user?.role === 'admin' && (
            <li>
              <Link to="/admin" className="flex items-center gap-3 py-2.5 font-medium">
                Admin dashboard
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </Drawer>
  );
}

const SUGGESTIONS = ['Eye patches', 'Hyaluronic', 'Vitamin C', 'Lip oil', 'Gua sha', 'Night cream'];

export function SearchOverlay() {
  const open = useUiStore((s) => s.searchOpen);
  const setOpen = useUiStore((s) => s.setSearch);
  const [q, setQ] = useState('');
  const debounced = useDebounce(q.trim(), 250);
  const navigate = useNavigate();
  const ref = useRef(null);
  const location = useLocation();
  useScrollLock(open);
  useFocusTrap(ref, open);
  useEffect(() => setOpen(false), [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const enabled = debounced.length >= 2;
  const { data, isFetching } = useProducts({ q: debounced, pageSize: 6 }, { enabled });
  const results = enabled ? data?.items ?? [] : [];

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75]">
          <motion.div className="absolute inset-0 bg-espresso/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} aria-hidden />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative max-h-[90vh] overflow-y-auto bg-ivory shadow-lift"
          >
            <div className="container-page py-5 sm:py-8">
              <form onSubmit={submit} role="search" className="flex items-center gap-3 border-b border-espresso pb-3">
                <Search aria-hidden className="h-5 w-5 shrink-0 text-taupe" strokeWidth={1.4} />
                <label htmlFor="site-search" className="sr-only">
                  Search by product, category, ingredient or SKU
                </label>
                <input
                  id="site-search"
                  data-autofocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search serums, patches, SKU…"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent font-display text-[1.5rem] placeholder:text-taupe-light focus:outline-none sm:text-[2rem]"
                />
                {isFetching && enabled && <Spinner />}
                <button type="button" onClick={() => setOpen(false)} className="icon-btn" aria-label="Close search">
                  <X className="h-5 w-5" strokeWidth={1.4} />
                </button>
              </form>

              {!enabled ? (
                <div className="py-6">
                  <p className="eyebrow mb-3">Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} type="button" onClick={() => setQ(s)} className="border border-line bg-porcelain px-3.5 py-2 text-[13px] transition-colors hover:border-espresso">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6" aria-live="polite">
                  {results.length === 0 && !isFetching ? (
                    <p className="text-[14.5px] text-taupe">No products match “{debounced}”. Try a product type such as “serum” or “patches”.</p>
                  ) : (
                    <>
                      <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((p) => (
                          <li key={p.id}>
                            <Link to={`/product/${p.slug}`} onClick={() => setOpen(false)} className="group flex items-center gap-4">
                              <img src={p.images[0]} alt="" width="56" height="70" className="aspect-product w-14 bg-linen object-cover" />
                              <span className="min-w-0">
                                <span className="block text-[11px] uppercase tracking-[0.12em] text-taupe">{p.brand?.name}</span>
                                <span className="block truncate text-[14.5px] group-hover:underline">{p.name}</span>
                                <span className="text-[13px] text-taupe">
                                  {formatPrice(p.priceMin)}
                                  {p.stockStatus === 'out_of_stock' && ' · Sold out'}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {data?.total > results.length && (
                        <button type="button" onClick={submit} className="mt-6 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] link-underline">
                          See all {data.total} results <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
