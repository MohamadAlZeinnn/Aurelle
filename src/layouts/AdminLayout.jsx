import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Boxes, ExternalLink, FolderTree, Image as ImageIcon, LogOut, Menu, MessageSquareText, Package, BellRing, Settings, ShoppingCart, Tags, Truck, Users, Warehouse,
} from 'lucide-react';
import { Drawer } from '../components/ui/index.js';
import { PageLoader } from '../components/layout/PageLoader.jsx';
import { adminService } from '../services/index.js';
import { useAuthStore } from '../stores/authStore.js';
import { IS_DEMO, BRAND } from '../config/env.js';
import { cn } from '../lib/format.js';

const NAV = [
  ['Overview', [['/admin', 'Dashboard', BarChart3, true]]],
  ['Catalogue', [['/admin/products', 'Products', Package], ['/admin/inventory', 'Inventory', Warehouse], ['/admin/categories', 'Categories', FolderTree]]],
  ['Sales', [['/admin/orders', 'Orders', ShoppingCart, false, 'pendingOrders'], ['/admin/customers', 'Customers', Users], ['/admin/coupons', 'Coupons', Tags]]],
  ['Engagement', [['/admin/content', 'Homepage', ImageIcon], ['/admin/reviews', 'Reviews', MessageSquareText, false, 'pendingReviews'], ['/admin/restock', 'Restock requests', BellRing, false, 'restockRequests']]],
  ['Settings', [['/admin/shipping', 'Shipping', Truck], ['/admin/settings', 'Store settings', Settings]]],
];

function SideNav({ counts, onNavigate }) {
  return (
    <nav aria-label="Admin" className="space-y-6">
      {NAV.map(([group, links]) => (
        <div key={group}>
          <p className="mb-1.5 px-3 text-[10.5px] font-medium uppercase tracking-[0.16em] text-taupe">{group}</p>
          <ul className="space-y-0.5">
            {links.map(([to, label, Icon, end, countKey]) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2 text-[14px] transition-colors', isActive ? 'bg-espresso text-ivory' : 'text-espresso-soft hover:bg-linen hover:text-espresso')}
                >
                  <Icon aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                  <span className="flex-1">{label}</span>
                  {countKey && counts?.[countKey] > 0 && (
                    <span className="min-w-[20px] rounded-full bg-champagne-soft px-1.5 text-center text-[11px] font-medium text-espresso" aria-label={`${counts[countKey]} need attention`}>
                      {counts[countKey]}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['admin', 'dashboard', 30], queryFn: () => adminService.dashboard(30), staleTime: 20_000 });
  const counts = data?.kpis;
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.title = `Admin — ${BRAND.name}`;
  }, [location.pathname]);

  const signOut = async () => {
    await logout();
    navigate('/');
  };

  const footer = (
    <div className="space-y-1 border-t border-line pt-4">
      <Link to="/" className="flex items-center gap-3 px-3 py-2 text-[13.5px] text-espresso-soft hover:text-espresso">
        <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={1.5} /> View storefront
      </Link>
      <button type="button" onClick={signOut} className="flex w-full items-center gap-3 px-3 py-2 text-[13.5px] text-espresso-soft hover:text-espresso">
        <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.5} /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory">
      <a href="#admin-main" className="sr-only z-[100] bg-espresso px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-line bg-porcelain lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-line px-6">
          <Link to="/admin" className="font-display text-[1.35rem] tracking-[0.3em]">
            {BRAND.shortName}
          </Link>
          <span className="text-[10.5px] uppercase tracking-[0.16em] text-taupe">Studio</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-6">
          <SideNav counts={counts} />
        </div>
        <div className="px-3 pb-4">{footer}</div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-ivory/95 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-2">
            <button type="button" className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open admin menu">
              <Menu className="h-5 w-5" strokeWidth={1.4} />
            </button>
            <Link to="/admin" className="font-display text-[1.2rem] tracking-[0.3em] lg:hidden">
              {BRAND.shortName}
            </Link>
            {IS_DEMO && <span className="hidden border border-champagne bg-champagne-soft px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] sm:inline">Demo data</span>}
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <span className="hidden text-taupe sm:inline">Signed in as</span>
            <span className="font-medium">{user.fullName}</span>
          </div>
        </header>
        <main id="admin-main" className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10" tabIndex={-1}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Admin" side="left" widthClass="max-w-[300px]" footer={footer}>
        <div className="px-3 py-5">
          <SideNav counts={counts} onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>
      <ScrollRestoration />
    </div>
  );
}
