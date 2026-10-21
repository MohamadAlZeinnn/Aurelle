import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Mail } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { useCategories, useStoreSettings } from '../../hooks/queries.js';
import { BRAND, IS_DEMO, whatsappLink } from '../../config/env.js';

const HELP = [
  ['Delivery across Lebanon', '/pages/delivery'],
  ['Returns & exchanges', '/pages/returns'],
  ['Frequently asked questions', '/pages/faq'],
  ['Track an order', '/track-order'],
  ['Contact us', '/pages/contact'],
];

export function Footer() {
  const { data: categories = [] } = useCategories();
  const { data: settings } = useStoreSettings();
  const wa = whatsappLink();
  const store = settings?.store;

  return (
    <footer className="mt-24 border-t border-line bg-linen/60">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo className="items-start" />
          <p className="mt-6 text-[14px] leading-relaxed text-espresso-soft">
            A small, considered beauty boutique in Beirut. We choose every product by hand, for its texture, its ingredients and the way it fits into a real routine.
          </p>
          <div className="mt-6 flex gap-1">
            {store?.instagramUrl && (
              <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Instagram (opens in a new tab)">
                <Instagram className="h-[18px] w-[18px]" strokeWidth={1.4} />
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="WhatsApp (opens in a new tab)">
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.4} />
              </a>
            )}
            <a href={`mailto:${store?.supportEmail || BRAND.supportEmail}`} className="icon-btn" aria-label="Email us">
              <Mail className="h-[18px] w-[18px]" strokeWidth={1.4} />
            </a>
          </div>
        </div>
        <FooterColumn title="Shop">
          <li>
            <Link to="/shop">Shop all</Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link to={`/shop/${c.slug}`}>{c.name}</Link>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="Help">
          {HELP.map(([label, to]) => (
            <li key={to}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="The house">
          <li>
            <Link to="/pages/about">Our story</Link>
          </li>
          <li>
            <Link to="/account">Your account</Link>
          </li>
          <li>
            <Link to="/wishlist">Wishlist</Link>
          </li>
          <li>
            <Link to="/pages/privacy">Privacy</Link>
          </li>
          <li>
            <Link to="/pages/terms">Terms of sale</Link>
          </li>
        </FooterColumn>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-[12px] text-taupe sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. Prices in US dollars. Cash on delivery across Lebanon.
          </p>
          {IS_DEMO && <p>Demo store — orders are simulated and no payments are taken.</p>}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <h2 className="eyebrow mb-5">{title}</h2>
      <ul className="space-y-2.5 text-[14px] text-espresso-soft [&_a:hover]:text-espresso [&_a]:transition-colors">{children}</ul>
    </div>
  );
}

export function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="border-b border-champagne/50 bg-champagne-soft/70 text-espresso">
      <p className="container-page py-1.5 text-center text-[11.5px]">
        <strong className="font-medium">Demo mode</strong> — data is stored in your browser, orders are simulated and no payment is taken.{' '}
        <Link to="/pages/demo" className="underline underline-offset-2">
          Demo accounts &amp; details
        </Link>
      </p>
    </div>
  );
}
