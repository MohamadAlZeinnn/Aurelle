import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Eye, EyeOff, Pencil, Plus, Star, Trash2, PackageSearch } from 'lucide-react';
import { AdminPageHeader, AdminTable, FilterSelect, SearchInput, Thumb, Toolbar } from '../../components/admin/AdminUi.jsx';
import { Badge, Button, ConfirmDialog, EmptyState, Pagination } from '../../components/ui/index.js';
import { StockBadge } from '../../components/product/StockBadge.jsx';
import { adminService } from '../../services/index.js';
import { useListParams } from '../../hooks/useListParams.js';
import { toast } from '../../stores/uiStores.js';
import { formatPrice } from '../../lib/money.js';
import { PRODUCT_STATUSES } from '../../constants/catalog.js';

function RowActions({ product, onAction }) {
  const btn = 'icon-btn h-8 w-8';
  return (
    <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      <Link to={`/admin/products/${product.id}`} className={btn} aria-label={`Edit ${product.name}`} title="Edit">
        <Pencil className="h-4 w-4" strokeWidth={1.5} />
      </Link>
      {product.status === 'published' ? (
        <button type="button" className={btn} onClick={() => onAction('unpublish', product)} aria-label={`Unpublish ${product.name}`} title="Unpublish (move to draft)">
          <EyeOff className="h-4 w-4" strokeWidth={1.5} />
        </button>
      ) : (
        <button type="button" className={btn} onClick={() => onAction('publish', product)} aria-label={`Publish ${product.name}`} title="Publish">
          <Eye className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}
      {product.status !== 'archived' && (
        <button type="button" className={btn} onClick={() => onAction('archive', product)} aria-label={`Archive ${product.name}`} title="Archive">
          <Archive className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}
      <button type="button" className={`${btn} text-rosewood`} onClick={() => onAction('delete', product)} aria-label={`Delete ${product.name}`} title="Delete">
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export default function ProductsPage() {
  const [params, set] = useListParams({ sort: 'updated' });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminService.categories });
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'products', params], queryFn: () => adminService.products(params), placeholderData: keepPreviousData });
  const [confirm, setConfirm] = useState(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['product'] });
    qc.invalidateQueries({ queryKey: ['home'] });
  };

  const patch = useMutation({
    mutationFn: ({ id, body }) => adminService.patchProduct(id, body),
    onSuccess: (p) => {
      invalidate();
      toast.success(`${p.name} is now ${PRODUCT_STATUSES[p.status].label.toLowerCase()}`);
      setConfirm(null);
    },
    onError: (e) => toast.error('Could not update product', { description: e.message }),
  });
  const remove = useMutation({
    mutationFn: (id) => adminService.deleteProduct(id),
    onSuccess: () => {
      invalidate();
      toast.success('Product deleted');
      setConfirm(null);
    },
    onError: (e) => {
      toast.error('Could not delete product', { description: e.message });
      setConfirm(null);
    },
  });

  const onAction = (action, product) => {
    if (action === 'publish') return patch.mutate({ id: product.id, body: { status: 'published' } });
    setConfirm({ action, product });
  };
  const totalStock = (p) => p.variants.reduce((s, v) => s + (v.discontinued ? 0 : v.stock), 0);

  const columns = [
    {
      key: 'product',
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <Thumb src={p.images[0]} size={36} />
          <div className="min-w-0">
            <Link to={`/admin/products/${p.id}`} className="block max-w-[260px] truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
              {p.name}
            </Link>
            <p className="text-[12px] text-taupe">
              {p.brand?.name} · {p.variants.length > 1 ? `${p.variants.length} variants` : p.variants[0].sku}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', cell: (p) => <span className="text-espresso-soft">{p.category?.name}</span> },
    { key: 'price', header: 'Price', align: 'right', cell: (p) => (p.priceMin === p.priceMax ? formatPrice(p.priceMin) : `${formatPrice(p.priceMin)}–${formatPrice(p.priceMax)}`) },
    {
      key: 'stock',
      header: 'Stock',
      cell: (p) => (
        <div className="flex items-center gap-2">
          <span className="w-8 text-right tabular-nums">{totalStock(p)}</span>
          <StockBadge status={p.stockStatus} />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={PRODUCT_STATUSES[p.status].tone}>{PRODUCT_STATUSES[p.status].label}</Badge>
          {p.isFeatured && <Star aria-label="Featured" className="h-3.5 w-3.5 fill-bronze text-bronze" />}
        </div>
      ),
    },
    { key: 'sold', header: 'Sold', align: 'right', cell: (p) => p.salesCount, hideOnCard: true },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (p) => <RowActions product={p} onAction={onAction} /> },
  ];

  const confirmCopy = {
    unpublish: ['Unpublish this product?', 'It will be hidden from the shop and moved to drafts. Existing orders are not affected.', 'Unpublish', 'primary'],
    archive: ['Archive this product?', 'Archived products are hidden from the shop but kept for order history and reporting. You can restore it later.', 'Archive', 'primary'],
    delete: ['Delete this product permanently?', 'This cannot be undone. Products that appear in past orders cannot be deleted — archive them instead.', 'Delete product', 'danger'],
  };
  const c = confirm && confirmCopy[confirm.action];

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description={data ? `${data.total} products` : 'Manage your catalogue'}
        actions={
          <Button to="/admin/products/new">
            <Plus aria-hidden className="h-4 w-4" /> Add product
          </Button>
        }
      />
      <Toolbar>
        <SearchInput value={params.q} onChange={(q) => set({ q })} placeholder="Search name, SKU or brand" label="Search products" className="sm:w-72" />
        <FilterSelect label="Status" value={params.status} onChange={(status) => set({ status })} options={[['', 'All statuses'], ['published', 'Published'], ['draft', 'Draft'], ['archived', 'Archived']]} className="sm:w-40" />
        <FilterSelect label="Category" value={params.category} onChange={(category) => set({ category })} options={[['', 'All categories'], ...categories.map((x) => [x.id, x.name])]} className="sm:w-44" />
        <FilterSelect label="Stock" value={params.stock} onChange={(stock) => set({ stock })} options={[['', 'Any stock'], ['in_stock', 'In stock'], ['low_stock', 'Low stock'], ['out_of_stock', 'Sold out'], ['discontinued', 'Discontinued']]} className="sm:w-40" />
        <FilterSelect
          label="Sort"
          value={params.sort}
          onChange={(sort) => set({ sort })}
          options={[['updated', 'Recently updated'], ['name', 'Name A–Z'], ['price', 'Price (low first)'], ['stock', 'Stock (low first)'], ['sales', 'Best selling']]}
          className="sm:ml-auto sm:w-48"
        />
      </Toolbar>
      <AdminTable
        loading={isLoading}
        error={error}
        onRetry={refetch}
        rows={data?.items}
        caption="Products"
        onRowClick={(p) => navigate(`/admin/products/${p.id}`)}
        empty={<EmptyState compact icon={PackageSearch} title="No products match" description="Try a different search or clear the filters." />}
        renderCard={(p) => (
          <div className="flex gap-3 border border-line bg-porcelain p-3">
            <Thumb src={p.images[0]} size={56} />
            <div className="min-w-0 flex-1">
              <Link to={`/admin/products/${p.id}`} className="block truncate font-medium">
                {p.name}
              </Link>
              <p className="text-[12px] text-taupe">
                {formatPrice(p.priceMin)} · {totalStock(p)} in stock
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={PRODUCT_STATUSES[p.status].tone}>{PRODUCT_STATUSES[p.status].label}</Badge>
                <StockBadge status={p.stockStatus} />
              </div>
            </div>
            <RowActions product={p} onAction={onAction} />
          </div>
        )}
      />
      {data && <Pagination className="mt-6" page={data.page} pages={data.pages} onChange={(page) => set({ page }, { resetPage: false })} />}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={c?.[0]}
        description={c?.[1]}
        confirmLabel={c?.[2]}
        tone={c?.[3]}
        loading={patch.isPending || remove.isPending}
        onConfirm={() => (confirm.action === 'delete' ? remove.mutate(confirm.product.id) : patch.mutate({ id: confirm.product.id, body: { status: confirm.action === 'archive' ? 'archived' : 'draft' } }))}
      >
        {confirm && <p className="mt-3 font-medium">{confirm.product.name}</p>}
      </ConfirmDialog>
    </div>
  );
}
