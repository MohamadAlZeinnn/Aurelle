import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Heart, KeyRound, LayoutGrid, LogOut, MapPin, Package, UserRound, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore.js';
import { toast } from '../stores/uiStores.js';
import { Notice } from '../components/ui/index.js';
import { cn } from '../lib/format.js';

const LINKS = [
  ['/account', 'Overview', LayoutGrid, true],
  ['/account/orders', 'Orders', Package],
  ['/wishlist', 'Wishlist', Heart],
  ['/account/addresses', 'Addresses', MapPin],
  ['/account/profile', 'Profile', UserRound],
  ['/account/password', 'Password', KeyRound],
];

export default function AccountLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const signOut = async () => {
    await logout();
    toast.show('You have been signed out');
    navigate('/');
  };

  return (
    <div className="container-page pb-10 pt-8 sm:pt-12">
      <div className="mb-8 sm:mb-12">
        <p className="eyebrow">Your account</p>
        <h1 className="mt-2 font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">Hello, {user.fullName.split(' ')[0]}</h1>
      </div>
      {location.state?.notice && <Notice tone="info" className="mb-6">{location.state.notice}</Notice>}
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-14">
        <nav aria-label="Account" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:border-0 lg:px-0">
          {LINKS.map(([to, label, Icon, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-3 border-b-2 px-3 py-3 text-[14px] transition-colors lg:border-b-0 lg:border-l-2 lg:py-2.5',
                  isActive ? 'border-espresso font-medium text-espresso' : 'border-transparent text-espresso-soft hover:text-espresso'
                )
              }
            >
              <Icon aria-hidden className="h-4 w-4" strokeWidth={1.4} />
              {label}
            </NavLink>
          ))}
          {user.role === 'admin' && (
            <NavLink to="/admin" className="flex shrink-0 items-center gap-3 border-b-2 border-transparent px-3 py-3 text-[14px] text-bronze lg:border-b-0 lg:border-l-2 lg:py-2.5">
              <ShieldCheck aria-hidden className="h-4 w-4" strokeWidth={1.4} /> Admin
            </NavLink>
          )}
          <button type="button" onClick={signOut} className="flex shrink-0 items-center gap-3 px-3 py-3 text-[14px] text-espresso-soft hover:text-espresso lg:mt-4 lg:border-l-2 lg:border-transparent lg:py-2.5">
            <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.4} /> Sign out
          </button>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
