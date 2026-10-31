"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { navigation } from "@/data/site-config";
import { useCart } from "@/components/cart/CartProvider";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchOverlay } from "@/components/layout/SearchOverlay";

export function Header() {
  const pathname = usePathname();
  const { count, hydrated, open: openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled ? "border-b border-ink/10 bg-ivory/90 backdrop-blur-md" : "border-b border-transparent bg-ivory"
        }`}
      >
        <div className={`container-site grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-500 ${scrolled ? "h-16" : "h-[4.5rem] md:h-20"}`}>
          {/* Left */}
          <div className="flex items-center">
            <button
              type="button"
              className="-ml-2 p-2 md:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <nav aria-label="Primary" className="hidden items-center gap-10 md:flex">
              {navigation.primary.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link" aria-current={isActive(item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Centre */}
          <Link href="/" aria-label="AURELLE — home" className="wordmark text-[1.45rem] leading-none md:text-[1.75rem]">
            Aurelle
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-1 md:gap-3">
            <button type="button" className="p-2 transition-colors hover:text-clay" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              className="relative -mr-2 flex items-center gap-2 p-2 transition-colors hover:text-clay"
              onClick={openCart}
              aria-label={`Shopping bag, ${hydrated ? count : 0} ${count === 1 ? "item" : "items"}`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.25} />
              <span className="hidden text-xs tracking-[0.16em] uppercase md:inline">Bag</span>
              <span
                aria-hidden
                className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] text-ivory tabular-nums transition-all duration-500 md:static md:bg-transparent md:p-0 md:text-xs md:text-ink ${
                  hydrated && count > 0 ? "absolute top-0.5 right-0 scale-100 opacity-100" : "absolute top-0.5 right-0 scale-50 opacity-0 md:scale-100 md:opacity-100"
                }`}
              >
                <span className="md:hidden">{hydrated ? count : 0}</span>
                <span className="hidden md:inline">({hydrated ? count : 0})</span>
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
