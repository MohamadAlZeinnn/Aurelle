import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { AdminPageHeader, AdminTable, FilterSelect, SearchInput, Toolbar } from '../../components/admin/AdminUi.jsx';
import { OrderCard, OrderStatusBadge, PaymentStatusBadge, paymentMethodLabel } from '../../components/order/OrderParts.jsx';
import { EmptyState, Input, Pagination } from '../../components/ui/index.js';
import { adminService } from '../../services/index.js';
import { useListParams } from '../../hooks/useListParams.js';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../../constants/orders.js';
import { governorateName } from '../../constants/lebanon.js';
import { formatPrice } from '../../lib/money.js';
import { formatDateTime, cn } from '../../lib/format.js';
import { formatLebanesePhone } from '../../lib/phone.js';

export default function OrdersPage() {
  const [params, set] = useListParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'orders', params], queryFn: () => adminService.orders(params), placeholderData: keepPreviousData });
  const counts = data?.counts ?? {};
  const quick = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'];

  return (
    <div>
      <AdminPageHeader title="Orders" description={data ? `${data.total} orders match` : 'Track and fulfil orders'} />
      <div className="scrollbar-none -mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
        <button type="button" onClick={() => set({ status: null })} aria-pressed={!params.status} className={cn('shrink-0 border px-3 py-2 text-[13px]', !params.status ? 'border-espresso bg-espresso text-ivory' : 'border-line-strong bg-porcelain hover:border-espresso')}>
          All
        </button>
        {quick.map((s) => (
          <button key={s} type="button" onClick={() => set({ status: s })} aria-pressed={params.status === s} className={cn('shrink-0 border px-3 py-2 text-[13px]', params.status === s ? 'border-espresso bg-espresso text-ivory' : 'border-line-strong bg-porcelain hover:border-espresso')}>
            {ORDER_STATUSES[s].label}
            <span className="ml-1.5 opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      <Toolbar>
        <SearchInput value={params.q} onChange={(q) => set({ q })} placeholder="Order no., customer, phone or email" label="Search orders" className="sm:w-80" />
        <FilterSelect label="Status" value={params.status} onChange={(status) => set({ status })} options={[['', 'Any status'], ...Object.entries(ORDER_STATUSES).map(([k, v]) => [k, v.label])]} className="sm:w-44" />
        <FilterSelect label="Payment" value={params.paymentStatus} onChange={(paymentStatus) => set({ paymentStatus })} options={[['', 'Any payment'], ...Object.entries(PAYMENT_STATUSES).map(([k, v]) => [k, v.label])]} className="sm:w-44" />
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="from">
            From date
          </label>
          <Input id="from" type="date" value={params.from ?? ''} onChange={(e) => set({ from: e.target.value })} className="!min-h-[40px] w-auto text-[13.5px]" />
          <span className="text-taupe" aria-hidden>
            –
          </span>
          <label className="sr-only" htmlFor="to">
            To date
          </label>
          <Input id="to" type="date" value={params.to ?? ''} onChange={(e) => set({ to: e.target.value })} className="!min-h-[40px] w-auto text-[13.5px]" />
        </div>
        <FilterSelect label="Sort" value={params.sort} onChange={(sort) => set({ sort })} options={[['', 'Newest first'], ['oldest', 'Oldest first']]} className="sm:ml-auto sm:w-40" />
      </Toolbar>
      <AdminTable
        loading={isLoading}
        error={error}
        onRetry={refetch}
        rows={data?.items}
        caption="Orders"
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
        empty={<EmptyState compact icon={ClipboardList} title="No orders found" description="Adjust the search or filters." />}
        renderCard={(o) => <OrderCard order={o} to={`/admin/orders/${o.id}`} showCustomer />}
        columns={[
          { key: 'ref', header: 'Order', cell: (o) => <span className="font-medium tracking-[0.02em]">{o.reference}</span> },
          { key: 'date', header: 'Placed', cell: (o) => <span className="whitespace-nowrap text-espresso-soft">{formatDateTime(o.createdAt)}</span> },
          {
            key: 'c',
            header: 'Customer',
            cell: (o) => (
              <div>
                <p>{o.customer.fullName}</p>
                <p className="text-[12px] text-taupe">
                  {formatLebanesePhone(o.customer.phone)} · {governorateName(o.shippingAddress.governorate)}
                </p>
              </div>
            ),
          },
          { key: 'items', header: 'Items', align: 'right', cell: (o) => o.items.reduce((s, i) => s + i.quantity, 0) },
          {
            key: 'pay',
            header: 'Payment',
            cell: (o) => (
              <div className="space-y-1">
                <PaymentStatusBadge status={o.paymentStatus} />
                <p className="text-[12px] text-taupe">{paymentMethodLabel(o)}</p>
              </div>
            ),
          },
          { key: 's', header: 'Fulfilment', cell: (o) => <OrderStatusBadge status={o.status} /> },
          { key: 't', header: 'Total', align: 'right', cell: (o) => <span className="font-medium">{formatPrice(o.total)}</span> },
        ]}
      />
      {data && <Pagination className="mt-6" page={data.page} pages={data.pages} onChange={(page) => set({ page }, { resetPage: false })} />}
    </div>
  );
}
