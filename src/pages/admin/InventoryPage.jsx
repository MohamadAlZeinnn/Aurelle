import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { History, SlidersVertical, PackageSearch } from 'lucide-react';
import { AdminPageHeader, AdminTable, FilterSelect, SearchInput, Thumb, Toolbar } from '../../components/admin/AdminUi.jsx';
import { Badge, Button, Drawer, EmptyState, Field, Input, Modal, Notice, Pagination, Select, Skeleton, Textarea } from '../../components/ui/index.js';
import { StockBadge } from '../../components/product/StockBadge.jsx';
import { adminService } from '../../services/index.js';
import { stockAdjustmentSchema } from '../../lib/adminValidation.js';
import { useListParams } from '../../hooks/useListParams.js';
import { toast } from '../../stores/uiStores.js';
import { formatDateTime, cn } from '../../lib/format.js';

const TYPE_LABELS = { restock: 'Restock received', correction: 'Stock correction', damage: 'Damaged / expired', return: 'Customer return', sale: 'Sale' };
const TYPE_TONES = { restock: 'sage', correction: 'slate', damage: 'rosewood', return: 'bronze', sale: 'neutral' };

function AdjustForm({ row, onDone }) {
  const qc = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { productId: row.productId, variantId: row.variantId, mode: row.stock === 0 ? 'add' : 'add', quantity: '', type: 'restock', note: '' },
  });
  const [mode, quantity] = useWatch({ control, name: ['mode', 'quantity'] });
  const q = Number(quantity) || 0;
  const after = mode === 'add' ? row.stock + q : mode === 'remove' ? row.stock - q : q;

  const onSubmit = async (values) => {
    try {
      const entry = await adminService.adjustStock(values);
      ['admin', 'products', 'product', 'home', 'cart-quote'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast.success('Stock updated', { description: `${row.sku}: ${entry.before} → ${entry.after}` });
      onDone();
    } catch (e) {
      if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => setError(k, { message }));
      else setError('root', { message: e.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 px-5 py-6 sm:px-7">
      <div className="flex items-center gap-3">
        <Thumb src={row.image} size={40} />
        <div>
          <p className="font-medium">{row.productName}</p>
          <p className="text-[12.5px] text-taupe">
            {row.variantName !== 'Default' && `${row.variantName} · `}
            {row.sku} · currently <strong className="text-espresso">{row.stock}</strong>
          </p>
        </div>
      </div>
      {row.discontinued && <Notice tone="warning">This variant is discontinued. Customers cannot buy it even if stock is added.</Notice>}
      <fieldset>
        <legend className="field-label">Adjustment</legend>
        <div className="grid grid-cols-3 border border-line-strong">
          {[
            ['add', 'Add'],
            ['remove', 'Remove'],
            ['set', 'Set to'],
          ].map(([v, l]) => (
            <label key={v} className="cursor-pointer border-r border-line-strong last:border-r-0">
              <input type="radio" value={v} className="peer sr-only" {...register('mode')} />
              <span className="block py-2.5 text-center text-[13.5px] transition-colors peer-checked:bg-espresso peer-checked:text-ivory peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-bronze">{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quantity" error={errors.quantity?.message}>
          <Input type="number" min="0" step="1" inputMode="numeric" data-autofocus {...register('quantity')} />
        </Field>
        <Field label="Reason" error={errors.type?.message}>
          <Select {...register('type')}>
            {['restock', 'correction', 'damage', 'return'].map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Note" optional hint="e.g. supplier PO, audit reference" error={errors.note?.message}>
        <Textarea rows={2} {...register('note')} />
      </Field>
      <p className={cn('border px-4 py-3 text-[13.5px]', after < 0 ? 'border-rosewood/30 bg-rosewood-soft text-rosewood' : 'border-line bg-ivory')}>
        Stock after adjustment: <strong className="font-medium tabular-nums">{after}</strong>
        {after < 0 && ' — cannot go below zero.'}
        {row.stock === 0 && after > 0 && row.waitlist > 0 && ` · ${row.waitlist} restock request${row.waitlist > 1 ? 's' : ''} will become ready to notify.`}
      </p>
      {errors.root && <Notice tone="error">{errors.root.message}</Notice>}
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button variant="quiet" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={after < 0}>
          Save adjustment
        </Button>
      </div>
    </form>
  );
}

function HistoryList({ variantId, compact = false }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'adjustments', variantId, page], queryFn: () => adminService.adjustments({ variantId, page, pageSize: 20 }), placeholderData: keepPreviousData });
  if (isLoading) return <Skeleton className="h-40" />;
  if (!data.items.length) return <p className="py-6 text-center text-[13.5px] text-taupe">No stock movements recorded yet.</p>;
  return (
    <>
      <ol className="divide-y divide-line">
        {data.items.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TYPE_TONES[a.type]}>{TYPE_LABELS[a.type] ?? a.type}</Badge>
                {!compact && <span className="truncate text-[13px]">{a.productName}</span>}
              </div>
              <p className="mt-1 text-[12.5px] text-taupe">
                {formatDateTime(a.at)} · {a.by}
                {!compact && ` · ${a.sku}`}
              </p>
              {a.note && <p className="mt-0.5 text-[12.5px] text-espresso-soft">{a.note}</p>}
            </div>
            <div className="shrink-0 text-right tabular-nums">
              <p className={cn('text-[14px] font-medium', a.delta > 0 ? 'text-sage' : a.delta < 0 ? 'text-rosewood' : '')}>
                {a.delta > 0 ? '+' : ''}
                {a.delta}
              </p>
              <p className="text-[12px] text-taupe">
                {a.before} → {a.after}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <Pagination className="mt-4" page={data.page} pages={data.pages} onChange={setPage} />
    </>
  );
}

export default function InventoryPage() {
  const [params, set] = useListParams({ view: 'stock' });
  const qc = useQueryClient();
  const [adjusting, setAdjusting] = useState(null);
  const [history, setHistory] = useState(null);
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminService.categories });
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'inventory', params], queryFn: () => adminService.inventory(params), placeholderData: keepPreviousData, enabled: params.view !== 'history' });

  const toggleDiscontinued = useMutation({
    mutationFn: (row) => adminService.updateVariantInventory(row.variantId, { discontinued: !row.discontinued }),
    onSuccess: (_, row) => {
      ['admin', 'products', 'product'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast.success(row.discontinued ? 'Variant reactivated' : 'Variant discontinued', { description: row.sku });
    },
    onError: (e) => toast.error('Could not update', { description: e.message }),
  });

  const s = data?.summary;
  const tabs = [
    ['', 'All', null],
    ['out_of_stock', 'Sold out', s?.out_of_stock],
    ['low_stock', 'Low stock', s?.low_stock],
    ['in_stock', 'In stock', s?.in_stock],
    ['discontinued', 'Discontinued', s?.discontinued],
  ];

  return (
    <div>
      <AdminPageHeader title="Inventory" description="Stock is tracked per variant. Every change is recorded with who made it and why." />

      <div role="tablist" aria-label="Inventory views" className="mb-6 flex gap-6 border-b border-line">
        {[
          ['stock', 'Stock levels'],
          ['history', 'Adjustment history'],
        ].map(([v, l]) => (
          <button key={v} role="tab" type="button" aria-selected={params.view === v} onClick={() => set({ view: v, status: null, q: null })} className={cn('-mb-px border-b-2 pb-3 text-[14px]', params.view === v ? 'border-espresso font-medium' : 'border-transparent text-taupe hover:text-espresso')}>
            {l}
          </button>
        ))}
      </div>

      {params.view === 'history' ? (
        <div className="border border-line bg-porcelain px-5 py-2">
          <HistoryList />
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-5">
            {[
              ['Units on hand', s?.units],
              ['In stock', s?.in_stock],
              ['Low stock', s?.low_stock, 'text-amber'],
              ['Sold out', s?.out_of_stock, 'text-rosewood'],
              ['Discontinued', s?.discontinued],
            ].map(([l, v, cls]) => (
              <div key={l} className="bg-porcelain px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-taupe">{l}</p>
                <p className={cn('mt-1 font-display text-[1.5rem] tabular-nums', cls)}>{v ?? '—'}</p>
              </div>
            ))}
          </div>
          <Toolbar>
            <div className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1">
              {tabs.map(([v, l, c]) => (
                <button key={l} type="button" onClick={() => set({ status: v || null })} aria-pressed={(params.status ?? '') === v} className={cn('shrink-0 border px-3 py-2 text-[13px]', (params.status ?? '') === v ? 'border-espresso bg-espresso text-ivory' : 'border-line-strong bg-porcelain hover:border-espresso')}>
                  {l}
                  {c != null && <span className="ml-1.5 opacity-70">{c}</span>}
                </button>
              ))}
            </div>
            <SearchInput value={params.q} onChange={(q) => set({ q })} placeholder="Search product or SKU" label="Search inventory" className="sm:ml-auto sm:w-64" />
            <FilterSelect label="Category" value={params.category} onChange={(category) => set({ category })} options={[['', 'All categories'], ...categories.map((c) => [c.id, c.name])]} className="sm:w-44" />
          </Toolbar>

          <AdminTable
            loading={isLoading}
            error={error}
            onRetry={refetch}
            rows={data?.items}
            rowKey="variantId"
            caption="Inventory by variant"
            empty={<EmptyState compact icon={PackageSearch} title="No variants match" description="Try another filter." />}
            columns={[
              {
                key: 'p',
                header: 'Product',
                cell: (r) => (
                  <div className="flex items-center gap-3">
                    <Thumb src={r.image} size={32} />
                    <div className="min-w-0">
                      <Link to={`/admin/products/${r.productId}`} className="block max-w-[240px] truncate hover:underline">
                        {r.productName}
                      </Link>
                      <p className="text-[12px] text-taupe">
                        {r.variantName !== 'Default' ? r.variantName : 'Single variant'}
                        {r.productStatus !== 'published' && ` · ${r.productStatus}`}
                      </p>
                    </div>
                  </div>
                ),
              },
              { key: 'sku', header: 'SKU', cell: (r) => <span className="font-mono text-[12.5px]">{r.sku}</span> },
              { key: 'stock', header: 'On hand', align: 'right', cell: (r) => <span className="text-[15px] font-medium">{r.stock}</span> },
              { key: 't', header: 'Low at', align: 'right', cell: (r) => <span className="text-taupe">≤ {r.lowStockThreshold}</span>, hideOnCard: true },
              { key: 'status', header: 'Status', cell: (r) => <StockBadge status={r.status} /> },
              { key: 'w', header: 'Waitlist', align: 'right', cell: (r) => (r.waitlist ? <Link to="/admin/restock" className="link-underline">{r.waitlist}</Link> : <span className="text-taupe">—</span>) },
              {
                key: 'a',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                cell: (r) => (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="quiet" onClick={() => setAdjusting(r)}>
                      <SlidersVertical aria-hidden className="h-3.5 w-3.5" /> Adjust
                    </Button>
                    <button type="button" className="icon-btn h-9 w-9" onClick={() => setHistory(r)} aria-label={`Stock history for ${r.sku}`} title="History">
                      <History className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ),
              },
            ]}
            renderCard={(r) => (
              <div className="border border-line bg-porcelain p-3">
                <div className="flex gap-3">
                  <Thumb src={r.image} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]">{r.productName}</p>
                    <p className="text-[12px] text-taupe">
                      {r.variantName !== 'Default' && `${r.variantName} · `}
                      {r.sku}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[15px] font-medium tabular-nums">{r.stock}</span>
                      <StockBadge status={r.status} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <Button size="sm" variant="quiet" className="flex-1" onClick={() => setAdjusting(r)}>
                    Adjust
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setHistory(r)}>
                    History
                  </Button>
                </div>
              </div>
            )}
          />
          {data && <Pagination className="mt-6" page={data.page} pages={data.pages} onChange={(page) => set({ page }, { resetPage: false })} />}
        </>
      )}

      <Modal open={Boolean(adjusting)} onClose={() => setAdjusting(null)} title="Adjust stock" size="md">
        {adjusting && <AdjustForm row={adjusting} onDone={() => setAdjusting(null)} />}
      </Modal>
      <Drawer
        open={Boolean(history)}
        onClose={() => setHistory(null)}
        title="Stock history"
        footer={
          history && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="quiet" onClick={() => toggleDiscontinued.mutate(history, { onSuccess: () => setHistory(null) })} loading={toggleDiscontinued.isPending}>
                {history.discontinued ? 'Reactivate variant' : 'Mark as discontinued'}
              </Button>
              <Button size="sm" onClick={() => (setAdjusting(history), setHistory(null))}>
                Adjust stock
              </Button>
            </div>
          )
        }
      >
        {history && (
          <div className="px-5 py-4">
            <p className="text-[14px] font-medium">{history.productName}</p>
            <p className="mb-3 text-[12.5px] text-taupe">
              {history.variantName} · {history.sku} · {history.stock} on hand
            </p>
            <HistoryList variantId={history.variantId} compact />
          </div>
        )}
      </Drawer>
    </div>
  );
}
