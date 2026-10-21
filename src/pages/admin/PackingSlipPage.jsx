import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/index.js';
import { PageLoader } from '../../components/layout/PageLoader.jsx';
import { ErrorState } from '../../components/ui/index.js';
import { governorateName } from '../../constants/lebanon.js';
import { formatDateTime } from '../../lib/format.js';
import { formatPrice } from '../../lib/money.js';
import { formatLebanesePhone } from '../../lib/phone.js';
import { BRAND } from '../../config/env.js';

/** Print-ready packing slip (A4/Letter). Includes the COD amount to collect. */
export default function PackingSlipPage() {
  const { id } = useParams();
  const { data: o, isLoading, error } = useQuery({ queryKey: ['admin', 'order', id], queryFn: () => adminService.order(id) });
  useEffect(() => {
    if (o) document.title = `Packing slip ${o.reference}`;
  }, [o]);
  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState error={error} />;
  const a = o.shippingAddress;
  const collect = o.paymentMethod === 'cod' && o.paymentStatus === 'pending' ? o.total : 0;

  return (
    <div className="min-h-screen bg-white px-6 py-8 text-espresso print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-[760px] justify-end gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => window.close()}>
          Close
        </button>
      </div>
      <article className="mx-auto max-w-[760px] border border-line p-10 print:border-0">
        <header className="flex items-start justify-between border-b border-espresso pb-6">
          <div>
            <p className="font-display text-[1.8rem] tracking-[0.3em]">{BRAND.shortName}</p>
            <p className="text-[12px] uppercase tracking-[0.2em] text-taupe">Packing slip</p>
          </div>
          <div className="text-right text-[13px]">
            <p className="text-[18px] font-medium">{o.reference}</p>
            <p>{formatDateTime(o.createdAt)}</p>
          </div>
        </header>
        <section className="grid grid-cols-2 gap-8 py-6 text-[13.5px]">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-taupe">Deliver to</p>
            <p className="font-medium">{o.customer.fullName}</p>
            <p>{formatLebanesePhone(o.customer.phone)}</p>
            <p className="mt-2">
              {a.building}
              {a.floor && `, floor ${a.floor}`}
            </p>
            <p>{a.street}</p>
            <p>
              {a.city}, {a.district}, {governorateName(a.governorate)}
            </p>
            {a.landmark && <p>Near: {a.landmark}</p>}
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-taupe">Courier instructions</p>
            <p>{a.instructions || '—'}</p>
            <p className="mb-1 mt-4 text-[11px] uppercase tracking-[0.16em] text-taupe">Amount to collect</p>
            <p className="text-[22px] font-medium">{collect ? formatPrice(collect) : 'Nothing — prepaid'}</p>
          </div>
        </section>
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="border-y border-espresso text-left text-[11px] uppercase tracking-[0.14em]">
              <th className="py-2">✓</th>
              <th className="py-2">Item</th>
              <th className="py-2">SKU</th>
              <th className="py-2 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.variantId} className="border-b border-line">
                <td className="w-8 py-3">
                  <span className="inline-block h-4 w-4 border border-espresso" />
                </td>
                <td className="py-3">
                  {i.name}
                  {i.variantName && <span className="text-taupe"> — {i.variantName}</span>}
                </td>
                <td className="py-3 font-mono text-[12px]">{i.sku}</td>
                <td className="py-3 text-right text-[15px] font-medium">{i.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="mt-10 text-[12px] text-taupe">Thank you for shopping with {BRAND.name}. Questions? WhatsApp us or reply to your confirmation message.</footer>
      </article>
    </div>
  );
}
