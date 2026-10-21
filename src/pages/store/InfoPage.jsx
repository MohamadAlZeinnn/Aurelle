import { Link, useParams } from 'react-router-dom';
import { MessageCircle, Mail } from 'lucide-react';
import NotFoundPage from './NotFoundPage.jsx';
import { Accordion, Skeleton } from '../../components/ui/index.js';
import { useStoreSettings } from '../../hooks/queries.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { governorateName } from '../../constants/lebanon.js';
import { formatPrice } from '../../lib/money.js';
import { BRAND, IS_DEMO, whatsappLink } from '../../config/env.js';

function DeliveryTable({ shipping }) {
  return (
    <div className="not-prose overflow-x-auto">
      <table className="table-base mt-2 min-w-[420px] bg-porcelain">
        <thead>
          <tr>
            <th scope="col">Governorate</th>
            <th scope="col">Delivery fee</th>
            <th scope="col">Typical timing</th>
          </tr>
        </thead>
        <tbody>
          {shipping.zones
            .filter((z) => z.enabled)
            .map((z) => (
              <tr key={z.governorate}>
                <td>{governorateName(z.governorate)}</td>
                <td className="tabular-nums">{formatPrice(z.fee)}</td>
                <td className="text-taupe">{z.estimate || 'Confirmed by phone after ordering'}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

const PAGES = {
  about: {
    title: 'Our story',
    description: 'LUMA is a small beauty boutique in Beirut choosing skincare, eye care and tools by hand.',
    body: () => (
      <>
        <p>LUMA began in a small studio in Achrafieh with a simple idea: a beauty shelf should feel calm. We test every texture ourselves, read every ingredient list, and only stock what we would happily use every day.</p>
        <p>
          Alongside our own LUMA Atelier formulas we work with a handful of independent houses from France, Italy, Japan and Korea — and with Noor &amp; Co., who make their balms and masks in small batches in Lebanon.
        </p>
        <h2>What we promise</h2>
        <ul>
          <li>Honest descriptions: we describe textures and ingredients, not miracles.</li>
          <li>Real stock levels: if something is low or sold out, we say so.</li>
          <li>Cash on delivery across Lebanon, with no obligation to pay online.</li>
        </ul>
      </>
    ),
  },
  delivery: {
    title: 'Delivery across Lebanon',
    description: 'Delivery fees by governorate, cash on delivery and how we confirm orders.',
    body: ({ settings }) => (
      <>
        <p>We deliver to every governorate in Lebanon through our courier partner. After you place an order, our team confirms it with you by phone or WhatsApp before it is prepared.</p>
        {settings?.shipping && (
          <>
            <h2>Fees by region</h2>
            {settings.shipping.freeShippingThreshold != null && <p>Delivery is complimentary on orders of {formatPrice(settings.shipping.freeShippingThreshold)} or more after discounts.</p>}
            <DeliveryTable shipping={settings.shipping} />
          </>
        )}
        <h2>Paying on delivery</h2>
        <p>Cash on delivery is available on every order. Please have the exact amount in US dollars ready where possible. Where offered, you can also choose a manual transfer at checkout — we will send instructions after confirming your order.</p>
      </>
    ),
  },
  returns: {
    title: 'Returns & exchanges',
    description: 'Our returns policy for unopened products and damaged deliveries.',
    body: ({ settings }) => (
      <>
        <p>{settings?.store?.returnsPolicy}</p>
        <h2>How to start a return</h2>
        <p>Message us with your order number within 14 days of delivery. We will arrange a pickup or let you know where to drop the item. Refunds are made in the original payment method, or in cash for cash-on-delivery orders.</p>
        <h2>Damaged or incorrect items</h2>
        <p>If anything arrives damaged or is not what you ordered, contact us within 48 hours with a photo and we will replace it at no cost.</p>
      </>
    ),
  },
  faq: {
    title: 'Frequently asked questions',
    description: 'Answers about orders, delivery, payment and products.',
    faq: [
      ['Do I need an account to order?', 'No. You can check out as a guest. An account lets you save addresses and see your order history in one place.'],
      ['How do I pay?', 'Cash on delivery is available everywhere we deliver. Some orders can also be paid by manual transfer once confirmed. We never ask for card details.'],
      ['Can I change or cancel my order?', 'If your order is still pending you can cancel it from your account, or contact us and we will help. Once it is being prepared we will do our best but cannot always make changes.'],
      ['What does “Sold out — notify me” mean?', 'The item is temporarily out of stock. Leave your email and we will send one message when it is back.'],
      ['Are the products suitable for sensitive skin?', 'Each product page lists its full ingredients. If you have allergies or a skin condition, please check the list carefully and consult a professional; we are happy to answer questions about specific products.'],
    ],
  },
  contact: {
    title: 'Contact us',
    description: 'Reach the LUMA team by WhatsApp or email.',
    body: ({ settings }) => {
      const wa = whatsappLink('Hello LUMA, I have a question.');
      return (
        <>
          <p>We reply Monday to Saturday, 10:00–18:00 Beirut time.</p>
          <div className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 p-5 hover:border-espresso">
                <MessageCircle aria-hidden className="h-5 w-5 text-bronze" strokeWidth={1.4} />
                <span>
                  <span className="block font-medium">WhatsApp</span>
                  <span className="text-[13px] text-taupe">{settings?.store?.supportPhone}</span>
                </span>
              </a>
            )}
            <a href={`mailto:${settings?.store?.supportEmail || BRAND.supportEmail}`} className="card flex items-center gap-3 p-5 hover:border-espresso">
              <Mail aria-hidden className="h-5 w-5 text-bronze" strokeWidth={1.4} />
              <span>
                <span className="block font-medium">Email</span>
                <span className="text-[13px] text-taupe">{settings?.store?.supportEmail || BRAND.supportEmail}</span>
              </span>
            </a>
          </div>
        </>
      );
    },
  },
  privacy: {
    title: 'Privacy',
    description: 'How LUMA uses your personal information.',
    body: () => (
      <>
        <p>We collect the details needed to deliver your order — your name, phone, email and address — and use them only to fulfil and support your order, and, if you opt in, to send our newsletter.</p>
        <p>We never collect or store payment card details. We do not sell your data. You can ask us to delete your account and personal data at any time.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms of sale',
    description: 'The terms that apply to orders placed with LUMA.',
    body: () => (
      <>
        <p>All prices are in US dollars and include applicable taxes. Orders are confirmed by our team before dispatch; if an item becomes unavailable we will contact you before making any change.</p>
        <p>Delivery fees are shown at checkout based on your governorate. Product descriptions are for information; please read the full ingredient list before use and patch test new skincare.</p>
      </>
    ),
  },
  demo: {
    title: 'About this demo',
    description: 'Demo accounts and how the demo store works.',
    body: () => (
      <>
        <p>
          {IS_DEMO
            ? 'This store is running in demo mode. All data — products, stock, orders and accounts — is simulated in your browser and saved to local storage. No real orders are placed and no payment is taken.'
            : 'This store is connected to a live API.'}
        </p>
        <h2>Demo accounts</h2>
        <ul>
          <li>
            Customer: <code>layla@example.com</code> / <code>Luma2026!</code>
          </li>
          <li>
            Administrator: <code>admin@lumabeauty.demo</code> / <code>Admin2026!</code>
          </li>
        </ul>
        <h2>Try these</h2>
        <ul>
          <li>
            Promo codes: <code>WELCOME10</code> (10% off over $30), <code>LUMADELIVERY</code> (free delivery), <code>EYECARE5</code> ($5 off eye care), <code>SUMMER20</code> (expired), <code>VIP15</code> (usage limit reached).
          </li>
          <li>Sold-out products: Rose Quartz Hydrogel Eye Patches, Overnight Honey Sleeping Mask; sold-out options on the Shea Lip Balm (Rose) and Terry Headband (Blush).</li>
          <li>
            Reset everything from <Link to="/admin/settings">Admin → Settings</Link>.
          </li>
        </ul>
      </>
    ),
  },
};

export default function InfoPage() {
  const { slug } = useParams();
  const page = PAGES[slug];
  const { data: settings, isLoading } = useStoreSettings();
  usePageMeta({ title: page?.title, description: page?.description, noindex: slug === 'demo' });
  if (!page) return <NotFoundPage />;
  return (
    <article className="container-page max-w-3xl py-14 sm:py-20">
      <p className="eyebrow mb-4">{BRAND.name}</p>
      <h1 className="font-display text-[2.4rem] leading-tight sm:text-[3.25rem]">{page.title}</h1>
      <div className="mt-8 space-y-4 text-[15.5px] leading-relaxed text-espresso-soft [&_code]:bg-linen [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13.5px] [&_code]:text-espresso [&_h2]:pt-6 [&_h2]:font-display [&_h2]:text-[1.6rem] [&_h2]:text-espresso [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {isLoading && !page.faq ? <Skeleton className="h-40" /> : page.body?.({ settings })}
        {page.faq && <Accordion items={page.faq.map(([q, a]) => ({ title: q, content: a }))} />}
      </div>
    </article>
  );
}
