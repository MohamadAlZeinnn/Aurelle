import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BellRing, Check, MessageSquareText, Trash2, Users, X } from 'lucide-react';
import { AdminPageHeader, AdminTable, FilterSelect, Panel, SearchInput, StatCard, Thumb, Toolbar } from '../../components/admin/AdminUi.jsx';
import { OrderCard } from '../../components/order/OrderParts.jsx';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Pagination, Skeleton, Stars } from '../../components/ui/index.js';
import { adminService } from '../../services/index.js';
import { useListParams } from '../../hooks/useListParams.js';
import { toast } from '../../stores/uiStores.js';
import { governorateName } from '../../constants/lebanon.js';
import { formatPrice } from '../../lib/money.js';
import { formatDate, formatDateTime, cn } from '../../lib/format.js';
import { formatLebanesePhone } from '../../lib/phone.js';

// ───────────────────────────── Customers
export function CustomersPage() {
  const [params, set] = useListParams({ sort: 'recent' });
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'customers', params], queryFn: () => adminService.customers(params), placeholderData: keepPreviousData });
  return (
    <div>
      <AdminPageHeader title="Customers" description="Registered accounts and guest buyers, grouped by phone number." />
      <Toolbar>
        <SearchInput value={params.q} onChange={(q) => set({ q })} placeholder="Name, email or phone" label="Search customers" className="sm:w-72" />
        <FilterSelect label="Type" value={params.type} onChange={(type) => set({ type })} options={[['', 'All customers'], ['account', 'Accounts'], ['guest', 'Guests']]} className="sm:w-40" />
        <FilterSelect label="Sort" value={params.sort} onChange={(sort) => set({ sort })} options={[['recent', 'Recent orders'], ['spent', 'Highest spend'], ['name', 'Name A–Z']]} className="sm:ml-auto sm:w-44" />
      </Toolbar>
      <AdminTable
        loading={isLoading}
        error={error}
        onRetry={refetch}
        rows={data?.items}
        rowKey="key"
        caption="Customers"
        onRowClick={(c) => navigate(`/admin/customers/${encodeURIComponent(c.key)}`)}
        empty={<EmptyState compact icon={Users} title="No customers found" />}
        columns={[
          {
            key: 'n',
            header: 'Customer',
            cell: (c) => (
              <div>
                <p className="font-medium">{c.fullName}</p>
                <p className="text-[12px] text-taupe">{c.email}</p>
              </div>
            ),
          },
          { key: 'p', header: 'Phone', cell: (c) => <span className="whitespace-nowrap">{formatLebanesePhone(c.phone)}</span> },
          { key: 't', header: 'Type', cell: (c) => <Badge tone={c.type === 'account' ? 'slate' : 'neutral'}>{c.type === 'account' ? 'Account' : 'Guest'}</Badge> },
          { key: 'o', header: 'Orders', align: 'right', cell: (c) => c.orderCount },
          { key: 's', header: 'Spent', align: 'right', cell: (c) => formatPrice(c.totalSpent) },
          { key: 'l', header: 'Last order', cell: (c) => (c.lastOrderAt ? formatDate(c.lastOrderAt) : '—') },
        ]}
      />
      {data && <Pagination className="mt-6" page={data.page} pages={data.pages} onChange={(page) => set({ page }, { resetPage: false })} />}
    </div>
  );
}

export function CustomerDetailPage() {
  const { key } = useParams();
  const { data: c, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'customer', key], queryFn: () => adminService.customer(key) });
  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  return (
    <div>
      <Link to="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] link-underline">
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Customers
      </Link>
      <AdminPageHeader title={c.fullName} description={`${c.type === 'account' ? 'Registered account' : 'Guest customer'} · first seen ${formatDate(c.createdAt)}`} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Orders" value={c.orderCount} />
        <StatCard label="Total spent" value={formatPrice(c.totalSpent)} hint="excl. cancelled & returned" />
        <StatCard label="Average order" value={formatPrice(c.orderCount ? c.totalSpent / Math.max(1, c.orders.filter((o) => !['cancelled', 'returned'].includes(o.status)).length) : 0)} />
        <StatCard label="Last order" value={c.lastOrderAt ? formatDate(c.lastOrderAt, { year: undefined }) : '—'} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Orders">
          <div className="grid gap-3 md:grid-cols-2">
            {c.orders.map((o) => (
              <OrderCard key={o.id} order={o} to={`/admin/orders/${o.id}`} />
            ))}
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Contact">
            <p className="text-[14px]">{c.email}</p>
            <p className="text-[14px]">{formatLebanesePhone(c.phone)}</p>
            {c.type === 'account' && <p className="mt-2 text-[12.5px] text-taupe">Newsletter: {c.marketingOptIn ? 'subscribed' : 'not subscribed'}</p>}
          </Panel>
          {c.addresses.length > 0 && (
            <Panel title="Saved addresses">
              <ul className="space-y-3 text-[13.5px]">
                {c.addresses.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium">
                      {a.label} {a.isDefault && <span className="text-[11px] uppercase tracking-[0.12em] text-sage">· default</span>}
                    </p>
                    <p className="text-espresso-soft">
                      {a.building}, {a.street}, {a.city} — {governorateName(a.governorate)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── Restock requests
export function RestockPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState([]);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'restock', status], queryFn: () => adminService.restockRequests(status ? { status } : {}) });
  const notify = useMutation({
    mutationFn: (ids) => adminService.notifyRestock(ids),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      setSelected([]);
      toast.success(`${r.notified} customer${r.notified === 1 ? '' : 's'} marked as notified`, { description: 'Demo mode: no emails are sent.' });
    },
    onError: (e) => toast.error('Could not notify', { description: e.message }),
  });
  const remove = useMutation({
    mutationFn: (id) => adminService.deleteRestockRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
  const ready = data?.filter((r) => r.status === 'ready') ?? [];
  const STATUS = { waiting: ['Waiting for stock', 'amber'], ready: ['Back in stock', 'sage'], notified: ['Notified', 'neutral'] };
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div>
      <AdminPageHeader
        title="Restock requests"
        description="Customers who asked to be told when a sold-out option returns. Requests become “back in stock” automatically when you add inventory."
        actions={
          <Button disabled={!ready.length} loading={notify.isPending} onClick={() => notify.mutate(selected.length ? selected : ready.map((r) => r.id))}>
            <BellRing aria-hidden className="h-4 w-4" /> Notify {selected.length || ready.length || ''} ready
          </Button>
        }
      />
      <Toolbar>
        <FilterSelect label="Status" value={status} onChange={(v) => setStatus(v || '')} options={[['', 'All requests'], ['waiting', 'Waiting for stock'], ['ready', 'Back in stock'], ['notified', 'Notified']]} className="sm:w-52" />
      </Toolbar>
      <AdminTable
        loading={isLoading}
        error={error}
        onRetry={refetch}
        rows={data}
        caption="Restock requests"
        empty={<EmptyState compact icon={BellRing} title="No restock requests" description="When customers ask to be notified about sold-out items, they appear here." />}
        columns={[
          {
            key: 'sel',
            header: <span className="sr-only">Select</span>,
            cell: (r) => (r.status === 'ready' ? <input type="checkbox" aria-label={`Select request from ${r.email}`} checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 accent-espresso" /> : null),
            hideOnCard: true,
          },
          {
            key: 'p',
            header: 'Product',
            cell: (r) => (
              <div className="flex items-center gap-3">
                <Thumb src={r.image} size={30} />
                <div>
                  <Link to={`/admin/products/${r.productId}`} className="hover:underline">
                    {r.productName}
                  </Link>
                  <p className="text-[12px] text-taupe">
                    {r.variantName !== 'Default' && `${r.variantName} · `}
                    {r.stock} in stock
                  </p>
                </div>
              </div>
            ),
          },
          { key: 'e', header: 'Email', cell: (r) => r.email },
          { key: 'd', header: 'Requested', cell: (r) => formatDate(r.createdAt) },
          { key: 's', header: 'Status', cell: (r) => <Badge tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</Badge> },
          {
            key: 'a',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (r) => (
              <button type="button" className="icon-btn h-8 w-8 text-rosewood" onClick={() => remove.mutate(r.id)} aria-label={`Delete request from ${r.email}`}>
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}

// ───────────────────────────── Reviews moderation
export function ReviewsPage() {
  const qc = useQueryClient();
  const [params, set] = useListParams({ status: 'pending' });
  const [deleting, setDeleting] = useState(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'reviews', params], queryFn: () => adminService.reviews({ ...params, status: params.status === 'all' ? undefined : params.status }), placeholderData: keepPreviousData });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    ['reviews', 'product', 'products', 'home'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
  const moderate = useMutation({
    mutationFn: ({ id, status }) => adminService.moderateReview(id, status),
    onSuccess: (r) => {
      invalidate();
      toast.success(r.status === 'approved' ? 'Review published' : r.status === 'rejected' ? 'Review rejected' : 'Review moved to pending');
    },
    onError: (e) => toast.error('Could not update review', { description: e.message }),
  });
  const remove = useMutation({
    mutationFn: (id) => adminService.deleteReview(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success('Review deleted');
    },
  });
  const tabs = [
    ['pending', `Pending${data?.counts?.pending ? ` (${data.counts.pending})` : ''}`],
    ['approved', 'Published'],
    ['rejected', 'Rejected'],
    ['all', 'All'],
  ];
  return (
    <div>
      <AdminPageHeader title="Reviews" description="Only approved reviews appear on the shop and count towards product ratings." />
      <div role="tablist" aria-label="Review status" className="mb-6 flex gap-6 overflow-x-auto border-b border-line">
        {tabs.map(([v, l]) => (
          <button key={l} role="tab" type="button" aria-selected={params.status === v} onClick={() => set({ status: v })} className={cn('-mb-px shrink-0 border-b-2 pb-3 text-[14px]', params.status === v ? 'border-espresso font-medium' : 'border-transparent text-taupe hover:text-espresso')}>
            {l}
          </button>
        ))}
      </div>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Skeleton className="h-64" />
      ) : !data.items.length ? (
        <EmptyState compact icon={MessageSquareText} title="Nothing to moderate" description="New reviews from customers will appear here." />
      ) : (
        <ul className="space-y-3">
          {data.items.map((r) => (
            <li key={r.id} className="border border-line bg-porcelain p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="sr-only">{r.rating} out of 5</span>
                    <Badge tone={r.status === 'approved' ? 'sage' : r.status === 'rejected' ? 'neutral' : 'amber'}>{r.status}</Badge>
                    {r.verifiedPurchase ? <Badge tone="slate">Verified purchase</Badge> : <span className="text-[12px] text-taupe">Not linked to an order</span>}
                  </div>
                  <p className="mt-2 font-medium">{r.title}</p>
                </div>
                <p className="text-[12.5px] text-taupe">
                  {r.author} · {formatDateTime(r.createdAt)}
                </p>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-espresso-soft">{r.body}</p>
              <p className="mt-2 text-[12.5px] text-taupe">
                On{' '}
                <Link to={`/admin/products/${r.productId}`} className="link-underline">
                  {r.productName}
                </Link>
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {r.status !== 'approved' && (
                  <Button size="sm" onClick={() => moderate.mutate({ id: r.id, status: 'approved' })}>
                    <Check aria-hidden className="h-3.5 w-3.5" /> Approve
                  </Button>
                )}
                {r.status !== 'rejected' && (
                  <Button size="sm" variant="quiet" onClick={() => moderate.mutate({ id: r.id, status: 'rejected' })}>
                    <X aria-hidden className="h-3.5 w-3.5" /> Reject
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-rosewood" onClick={() => setDeleting(r)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination className="mt-6" page={data.page} pages={data.pages} onChange={(page) => set({ page }, { resetPage: false })} />}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete this review?" description="It will be removed permanently. To hide it but keep a record, reject it instead." confirmLabel="Delete review" loading={remove.isPending} onConfirm={() => remove.mutate(deleting.id)} />
    </div>
  );
}
