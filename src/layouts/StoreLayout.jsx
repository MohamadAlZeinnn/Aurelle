import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Header } from '../components/layout/Header.jsx';
import { Footer, DemoBanner } from '../components/layout/Footer.jsx';
import { MobileNav, SearchOverlay } from '../components/layout/Overlays.jsx';
import { CartDrawer } from '../components/cart/CartDrawer.jsx';
import { QuickViewModal } from '../components/product/QuickViewModal.jsx';
import { PageLoader } from '../components/layout/PageLoader.jsx';

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-[100] bg-espresso px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <DemoBanner />
      <Header />
      <main id="main" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <MobileNav />
      <SearchOverlay />
      <QuickViewModal />
      <ScrollRestoration />
    </div>
  );
}
