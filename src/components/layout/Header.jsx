import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { IconButton } from '../ui/index.js';
import { useCategories, useStoreSettings } from '../../hooks/queries.js';
import { useCartStore, selectCartCount } from '../../stores/cartStore.js';
import { useUiStore, useWishlistStore } from '../../stores/uiStores.js';
import { useAuthStore } from '../../stores/authStore.js';
import { cn } from '../../lib/format.js';

function AnnouncementBar() {
  const { data } = useStoreSettings();
  const messages = data?.store?.announcements?.length ? data.store.announcements : ['Cash on delivery across Lebanon'];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, [messages.length]);
  return (
    <div className="bg-espresso text-ivory">
      <div className="container-page flex h-9 items-center justify-center">
        <p className="relative h-4 w-full overflow-hidden text-center text-[10px] uppercase tracking-[0.12em] xs:text-[11px] sm:tracking-[0.2em]" aria-live="off">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={i} className="absolute inset-0 truncate" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
              {messages[i % messages.length]}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>
    </div>
  );
}

function MegaMenu({ categories, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-x-0 top-full z-40 border-b border-line bg-ivory shadow-soft"
    >
      <div className="container-page grid grid-cols-[1fr_1fr_1fr_1fr_280px] gap-8 py-10">
        {categories.map((c) => (
          <div key={c.id}>
            <Link to={`/shop/${c.slug}`} onClick={onClose} className="font-display text-[1.15rem] hover:text-bronze">
              {c.name}
            </Link>
            <ul className="mt-3 space-y-2">
              {c.subcategories.map((s) => (
                <li key={s.id}>
                  <Link to={`/shop/${c.slug}?subcategory=${s.slug}`} onClick={onClose} className="text-[13.5px] text-espresso-soft hover:text-espresso">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Link to="/shop?isNew=true" onClick={onClose} className="group col-start-5 row-span-2 row-start-1 block">
          <div className="aspect-[4/5] overflow-hidden bg-linen">
            <img src="/images/editorial/category-serums.svg" alt="" width="280" height="350" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-taupe">Just arrived</p>
          <p className="font-display text-[1.15rem]">Shop new arrivals</p>
        </Link>
      </div>
    </motion.div>
  );
}

export function Header() {
  const { data: categories = [] } = useCategories();
  const count = useCartStore(selectCartCount);
  const wishCount = useWishlistStore((s) => s.ids.length);
  const user = useAuthStore((s) => s.user);
  const { openCart, setMobileNav, setSearch } = useUiStore();
  const [megaOpen, setMegaOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);
  const location = useLocation();
  const closeTimer = useRef(null);

  useEffect(() => setMegaOpen(false), [location.pathname, location.search]);
  // Subtle confirmation on the bag icon whenever the count goes up.
  useEffect(() => {
    const increased = count > prevCount.current;
    prevCount.current = count;
    if (!increased) return undefined;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [count]);

  const openMega = () => {
    clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMegaSoon = () => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  const navLink = ({ isActive }) => cn('relative py-3 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors hover:text-bronze', isActive && 'after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:bg-espresso');

  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <div className="relative border-b border-line bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[72px]">
          <div className="flex items-center gap-1 lg:-ml-2">
            <IconButton label="Open menu" className="lg:hidden" onClick={() => setMobileNav(true)}>
              <Menu className="h-5 w-5" strokeWidth={1.4} />
            </IconButton>
            <IconButton label="Search products" onClick={() => setSearch(true)}>
              <Search className="h-5 w-5" strokeWidth={1.4} />
            </IconButton>
            <button type="button" onClick={() => setSearch(true)} className="hidden text-[13px] text-taupe hover:text-espresso lg:inline">
              Search
            </button>
          </div>
          <Logo />
          <div className="-mr-2 flex items-center justify-end gap-0.5">
            <Link to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'} className="icon-btn hidden sm:inline-flex" aria-label={user ? 'Your account' : 'Sign in'} title={user ? 'Your account' : 'Sign in'}>
              <User className="h-5 w-5" strokeWidth={1.4} />
            </Link>
            <Link to="/wishlist" className="icon-btn relative" aria-label={`Wishlist${wishCount ? `, ${wishCount} saved` : ''}`} title="Wishlist">
              <Heart className="h-5 w-5" strokeWidth={1.4} />
              {wishCount > 0 && <span aria-hidden className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-bronze" />}
            </Link>
            <motion.span animate={bump ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}>
              <IconButton label={`Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={openCart} badge={count}>
                <ShoppingBag className="h-5 w-5" strokeWidth={1.4} />
              </IconButton>
            </motion.span>
          </div>
        </div>

        <nav aria-label="Main" className="hidden border-t border-line lg:block" onMouseLeave={closeMegaSoon}>
          <ul className="container-page flex items-center justify-center gap-9">
            <li onMouseEnter={openMega}>
              <button type="button" aria-expanded={megaOpen} aria-haspopup="true" onClick={() => setMegaOpen((o) => !o)} className="py-3 text-[12px] font-medium uppercase tracking-[0.16em] hover:text-bronze">
                Shop
              </button>
            </li>
            {categories.slice(0, 6).map((c) => (
              <li key={c.id} onMouseEnter={closeMegaSoon}>
                <NavLink to={`/shop/${c.slug}`} className={navLink}>
                  {c.name}
                </NavLink>
              </li>
            ))}
            <li onMouseEnter={closeMegaSoon}>
              <Link to="/shop?onSale=true" className={cn(navLink({ isActive: location.search.includes('onSale') }), 'text-rosewood')}>
                Offers
              </Link>
            </li>
          </ul>
          <AnimatePresence>{megaOpen && <div onMouseEnter={openMega}><MegaMenu categories={categories} onClose={() => setMegaOpen(false)} /></div>}</AnimatePresence>
        </nav>
      </div>
    </header>
  );
}
