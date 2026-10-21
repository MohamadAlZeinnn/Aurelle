import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Phone, Printer } from 'lucide-react';
import { AdminPageHeader, Panel } from '../../components/admin/AdminUi.jsx';
import { AddressBlock, OrderItemsList, OrderStatusBadge, OrderTimeline, OrderTotalsBlock, PaymentStatusBadge, paymentMethodLabel } from '../../components/order/OrderParts.jsx';
import { Button, Checkbox, ConfirmDialog, ErrorState, Field, Input, Modal, Notice, Skeleton, Textarea } from '../../components/ui/index.js';
import { adminService } from '../../services/index.js';
import { toast } from '../../stores/uiStores.js';
import { CANCELLABLE_STATUSES, ORDER_STATUSES, STATUS_TRANSITIONS } from '../../constants/orders.js';
import { formatDateTime } from '../../lib/format.js';
import { formatPrice, roundMoney } from '../../lib/money.js';

function RefundModal({ order, open, onClose, onSaved }) {
  const refunded = order.refunds.reduce((s, r) => s + r.amount, 0);
  const remaining = roundMoney(order.total - refunded);
  const [amount, setAmount] = useState(String(remaining));
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState(!order.inventoryRestored);
  const [markReturned, setMarkReturned] = useState(order.status === 'delivered');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const n = Number(amount);
    const errs = {};
    if (!(n >= 0) || n > remaining) errs.amount = `Enter an amount between $0 and ${formatPrice(remaining)}.`;
    if (!reason.trim()) errs.reason = 'Add a reason for your records.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      onSaved(await adminService.recordRefund(order.id, { amount: n, reason, restock, markReturned }));
      toast.success('Refund recorded');
      onClose();
    } catch (err) {
      setErrors({ root: err.message, ...(err.fieldErrors || {}) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Record refund or return" description="Records money returned to the customer. In demo mode no payment is processed.">
      <form onSubmit={submit} noValidate className="space-y-5 px-5 py-6 sm:px-7">
        <Field label="Refund amount (USD)" hint={`Up to ${formatPrice(remaining)} remaining`} error={errors.amount}>
          <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Reason" error={errors.reason}>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Returned unopened within 14 days" />
        </Field>
        {order.inventoryRestored ? (
          <Notice tone="info">Items from this order have already been returned to stock.</Notice>
        ) : (
          <Checkbox label="Return items to sellable stock" description="Only for unopened, undamaged items. Can only be done once per order." checked={restock} onChange={(e) => setRestock(e.target.checked)} />
        )}
        {order.status === 'delivered' && <Checkbox label="Mark order as returned" checked={markReturned} onChange={(e) => setMarkReturned(e.target.checked)} />}
        {errors.root && <Notice tone="error">{errors.root}</Notice>}
        <div className="flex justify-end gap-2 border-t border-line pt-5">
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Record refund
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: order, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'order', id], queryFn: () => adminService.order(id) });
  const [note, setNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [busy, setBusy] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelRestock, setCancelRestock] = useState(true);
  const [refundOpen, setRefundOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  const saved = (o) => {
    qc.setQueryData(['admin', 'order', id], o);
    qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    qc.invalidateQueries({ queryKey: ['admin', 'inventory'] });
    ['products', 'product', 'my-orders', 'my-order'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      saved(await fn());
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error('Action failed', { description: e.message });
      return false;
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <Skeleton className="h-[70vh]" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const nextStatuses = (STATUS_TRANSITIONS[order.status] || []).filter((s) => s !== 'cancelled' && s !== 'returned');
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const canRefund = ['shipped', 'out_for_delivery', 'delivered', 'returned'].includes(order.status) && order.refunds.reduce((s, r) => s + r.amount, 0) < order.total;
  const waPhone = order.customer.phone.replace('+', '');

  return (
    <div>
      <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] link-underline">
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Orders
      </Link>
      <AdminPageHeader
        title={`Order ${order.reference}`}
        description={`Placed ${formatDateTime(order.createdAt)} · ${order.source === 'web' ? 'Online store' : order.source}`}
        actions={
          <>
            <Button variant="quiet" size="sm" href={`/admin/orders/${order.id}/packing-slip`} target="_blank" rel="noopener">
              <Printer aria-hidden className="h-3.5 w-3.5" /> Packing slip
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
        <span className="text-[13px] text-taupe">{paymentMethodLabel(order)}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel title="Fulfilment">
            {nextStatuses.length ? (
              <div className="space-y-4">
                <p className="text-[13.5px] text-espresso-soft">
                  Currently <strong className="font-medium text-espresso">{ORDER_STATUSES[order.status].label.toLowerCase()}</strong>. Move the order to the next step when it happens.
                </p>
                <Field label="Note for the timeline" optional>
                  <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="e.g. Confirmed by phone, courier: Toters" />
                </Field>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((s, i) => (
                    <Button key={s} variant={i === 0 ? 'primary' : 'quiet'} loading={busy === s} onClick={() => setPendingStatus(s)}>
                      Mark as {ORDER_STATUSES[s].label.toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[13.5px] text-espresso-soft">This order is {ORDER_STATUSES[order.status].label.toLowerCase()}. No further fulfilment steps.</p>
            )}
            {(canCancel || canRefund || (order.paymentStatus === 'pending' && !['cancelled', 'returned'].includes(order.status))) && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                {order.paymentStatus === 'pending' && !['cancelled', 'returned'].includes(order.status) && (
                  <Button size="sm" variant="quiet" loading={busy === 'paid'} onClick={() => run('paid', () => adminService.setPaymentStatus(order.id, 'paid'), 'Payment marked as received')}>
                    Mark payment received
                  </Button>
                )}
                {canRefund && (
                  <Button size="sm" variant="quiet" onClick={() => setRefundOpen(true)}>
                    Record refund / return
                  </Button>
                )}
                {canCancel && (
                  <Button size="sm" variant="ghost" className="text-rosewood" onClick={() => setConfirmCancel(true)}>
                    Cancel order
                  </Button>
                )}
              </div>
            )}
          </Panel>

          <Panel title={`Items (${order.items.reduce((s, i) => s + i.quantity, 0)})`}>
            <OrderItemsList items={order.items} linkProducts={false} />
            <div className="mt-4 border-t border-line pt-5">
              <OrderTotalsBlock order={order} />
            </div>
            {order.refunds.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="eyebrow mb-2">Refunds</p>
                <ul className="space-y-1.5 text-[13px]">
                  {order.refunds.map((r) => (
                    <li key={r.id} className="flex justify-between gap-3">
                      <span>
                        {formatDateTime(r.at)} · {r.reason}
                        {r.restocked && <span className="text-taupe"> · restocked</span>}
                      </span>
                      <span className="tabular-nums">−{formatPrice(r.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel title="Internal notes" description="Visible to staff only">
            <ul className="mb-4 space-y-3">
              {order.notes.length === 0 && <li className="text-[13.5px] text-taupe">No notes yet.</li>}
              {order.notes.map((n) => (
                <li key={n.id} className="border-l-2 border-champagne pl-3">
                  <p className="text-[14px]">{n.text}</p>
                  <p className="text-[12px] text-taupe">
                    {n.author} · {formatDateTime(n.at)}
                  </p>
                </li>
              ))}
            </ul>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!note.trim()) return;
                if (await run('note', () => adminService.addOrderNote(order.id, note))) setNote('');
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="note" className="sr-only">
                Add a note
              </label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team" maxLength={500} />
              <Button type="submit" variant="secondary" loading={busy === 'note'} disabled={!note.trim()}>
                Add note
              </Button>
            </form>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <AddressBlock address={order.shippingAddress} customer={order.customer} />
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <Button size="sm" variant="quiet" href={`tel:${order.customer.phone}`}>
                <Phone aria-hidden className="h-3.5 w-3.5" /> Call
              </Button>
              <Button size="sm" variant="quiet" href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${order.customer.fullName.split(' ')[0]}, this is LUMA about your order ${order.reference}.`)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden className="h-3.5 w-3.5" /> WhatsApp
              </Button>
            </div>
            {order.customerId ? <p className="mt-3 text-[12.5px] text-taupe">Registered customer</p> : <p className="mt-3 text-[12.5px] text-taupe">Guest checkout</p>}
          </Panel>
          <Panel title="Timeline">
            <OrderTimeline order={order} />
          </Panel>
          <Panel title="Inventory">
            <p className="text-[13.5px] text-espresso-soft">
              {order.inventoryRestored ? 'Items from this order have been returned to stock.' : 'Stock was allocated when this order was placed.'}
            </p>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        tone="primary"
        title={pendingStatus ? `Mark as ${ORDER_STATUSES[pendingStatus].label.toLowerCase()}?` : ''}
        description={pendingStatus === 'delivered' && order.paymentMethod === 'cod' ? 'Payment will also be marked as received (cash collected by the courier).' : 'The customer will see this update on their order tracking.'}
        confirmLabel="Update status"
        loading={Boolean(busy)}
        onConfirm={async () => {
          const s = pendingStatus;
          if (await run(s, () => adminService.setOrderStatus(order.id, { status: s, note: statusNote }), `Order marked as ${ORDER_STATUSES[s].label.toLowerCase()}`)) setStatusNote('');
          setPendingStatus(null);
        }}
      />
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this order?"
        confirmLabel="Cancel order"
        loading={busy === 'cancel'}
        onConfirm={async () => {
          await run('cancel', () => adminService.cancelOrder(order.id, { restock: cancelRestock, reason: 'Cancelled by store.' }), 'Order cancelled');
          setConfirmCancel(false);
        }}
      >
        <p>The customer will see the order as cancelled. This cannot be undone.</p>
        <Checkbox className="mt-4" label="Return items to stock" description="Recommended unless the items were damaged." checked={cancelRestock} onChange={(e) => setCancelRestock(e.target.checked)} />
      </ConfirmDialog>
      <RefundModal key={refundOpen ? 'open' : 'closed'} order={order} open={refundOpen} onClose={() => setRefundOpen(false)} onSaved={saved} />
    </div>
  );
}
