import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BellRing, CircleDollarSign, Clock, PackageCheck, PackageX, ShoppingBag, Boxes } from 'lucide-react';
import { AdminPageHeader, AdminTable, Panel, StatCard, Thumb } from '../../components/admin/AdminUi.jsx';
import { BarList, SalesTrendChart } from '../../components/admin/Charts.jsx';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/order/OrderParts.jsx';
import { StockBadge } from '../../components/product/StockBadge.jsx';
import { ErrorState, Skeleton } from '../../components/ui/index.js';
import { adminService } from '../../services/index.js';
import { formatPrice } from '../../lib/money.js';
import { formatDate } from '../../lib/format.js';
import { ORDER_STATUSES } from '../../constants/orders.js';
import { cn } from '../../lib/format.js';

const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'dashboard', days], queryFn: () => adminService.dashboard(days) });

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const k = data?.kpis;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={formatDate(new Date().toISOString(), { weekday: 'long' })}
        title="Dashboard"
        description="Sales exclude cancelled and returned orders."
        actions={
          <div role="group" aria-label="Date range" className="inline-flex border border-line-strong bg-porcelain">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className={cn('px-4 py-2 text-[13px] transition-colors', days === d ? 'bg-espresso text-ivory' : 'hover:bg-linen')}>
                {d} days
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[124px]" />)
        ) : (
          <>
            <StatCard label="Total sales" value={formatPrice(k.sales)} change={pct(k.sales, k.salesPrev)} hint={`vs previous ${days} days`} icon={CircleDollarSign} />
            <StatCard label="Orders" value={k.orders} change={pct(k.orders, k.ordersPrev)} hint={`avg. ${formatPrice(k.averageOrder)}`} icon={ShoppingBag} />
            <StatCard label="Pending orders" value={k.pendingOrders} hint={`${k.inFulfilment} in fulfilment`} icon={Clock} tone={k.pendingOrders ? 'warning' : undefined} />
            <StatCard label="Delivered" value={k.completedOrders} hint="all time" icon={PackageCheck} />
            <StatCard label="Products in stock" value={k.productsInStock} hint="published, purchasable" icon={Boxes} />
            <StatCard label="Low-stock options" value={k.lowStockVariants} hint="at or below threshold" icon={AlertTriangle} tone={k.lowStockVariants ? 'warning' : undefined} />
            <StatCard label="Sold-out products" value={k.soldOutProducts} hint="visible as sold out" icon={PackageX} tone={k.soldOutProducts ? 'critical' : undefined} />
            <StatCard label="Restock requests" value={k.restockRequests} hint={`${k.pendingReviews} reviews to moderate`} icon={BellRing} />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Sales trend" description={`Daily order value, last ${days} days`}>
          {isLoading ? <Skeleton className="h-[240px]" /> : <SalesTrendChart series={data.series} />}
        </Panel>
        <Panel title="Top sellers" description="Units sold in period">
          {isLoading ? (
            <Skeleton className="h-[240px]" />
          ) : data.topProducts.length ? (
            <BarList
              items={data.topProducts.map((p) => ({ key: p.productId, label: p.name, value: p.units, revenue: p.revenue }))}
              format={(v) => `${v} units`}
              labelRender={(i) => (
                <Link to={`/admin/products/${i.key}`} className="hover:underline">
                  {i.label}
                </Link>
              )}
            />
          ) : (
            <p className="text-[14px] text-taupe">No sales in this period.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Recent orders"
          bodyClassName="p-0 md:p-0"
          action={
            <Link to="/admin/orders" className="text-[12px] font-medium uppercase tracking-[0.12em] link-underline">
              All orders
            </Link>
          }
        >
          <div className="p-3 md:p-0 [&_.border]:md:border-0">
            <AdminTable
              loading={isLoading}
              rows={data?.recentOrders}
              onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
              caption="Recent orders"
              columns={[
                { key: 'ref', header: 'Order', cell: (o) => <Link to={`/admin/orders/${o.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{o.reference}</Link> },
                { key: 'customer', header: 'Customer', cell: (o) => o.customer.fullName },
                { key: 'date', header: 'Date', cell: (o) => formatDate(o.createdAt, { year: undefined }) },
                { key: 'status', header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
                { key: 'pay', header: 'Payment', cell: (o) => <PaymentStatusBadge status={o.paymentStatus} />, hideOnCard: true },
                { key: 'total', header: 'Total', align: 'right', cell: (o) => formatPrice(o.total) },
              ]}
            />
          </div>
        </Panel>
        <Panel
          title="Inventory warnings"
          action={
            <Link to="/admin/inventory?status=low_stock" className="text-[12px] font-medium uppercase tracking-[0.12em] link-underline">
              Inventory
            </Link>
          }
        >
          {isLoading ? (
            <Skeleton className="h-60" />
          ) : data.inventoryWarnings.length ? (
            <ul className="divide-y divide-line">
              {data.inventoryWarnings.map((w) => (
                <li key={w.variantId} className="flex items-center gap-3 py-3 first:pt-0">
                  <Thumb src={w.image} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px]">{w.name}</p>
                    <p className="text-[12px] text-taupe">
                      {w.variantName !== 'Default' && `${w.variantName} · `}
                      {w.stock} left{w.waitlist ? ` · ${w.waitlist} waiting` : ''}
                    </p>
                  </div>
                  <StockBadge status={w.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-taupe">All published options are comfortably stocked.</p>
          )}
        </Panel>
      </div>

      {!isLoading && (
        <Panel title="Orders by status" description="All time">
          <ul className="flex flex-wrap gap-2">
            {Object.keys(ORDER_STATUSES).map((s) => {
              const count = data.statusBreakdown.find((x) => x.status === s)?.count ?? 0;
              return (
                <li key={s}>
                  <Link to={`/admin/orders?status=${s}`} className="flex items-center gap-2 border border-line px-3 py-2 text-[13px] transition-colors hover:border-espresso">
                    <OrderStatusBadge status={s} />
                    <span className="tabular-nums">{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
