import { HttpError, notFound, paginate } from '../http.js';
import { newId } from '../db.js';
import { restoreOrderInventory, serializeOrder } from '../domain.js';
import { CANCELLABLE_STATUSES, ORDER_STATUSES, STATUS_TRANSITIONS } from '../../../constants/orders.js';
import { roundMoney } from '../../../lib/money.js';

const ADMIN = { auth: 'admin' };

const findOrder = (db, id) => {
  const order = db.orders.find((o) => o.id === id || o.reference === id);
  if (!order) throw notFound('Order');
  return order;
};

const stamp = (order, status, note, by) => {
  const now = new Date().toISOString();
  order.history.push({ status, at: now, note: note || '', by });
  order.updatedAt = now;
};

export function registerAdminOrderRoutes(router) {
  router.get(
    '/admin/orders',
    ({ db, query }) => {
      let rows = db.orders;
      if (query.q) {
        const q = query.q.toLowerCase().replace(/\s/g, '');
        rows = rows.filter(
          (o) =>
            o.reference.toLowerCase().includes(q) ||
            o.customer.fullName.toLowerCase().replace(/\s/g, '').includes(q) ||
            o.customer.phone.replace('+961', '').includes(q.replace(/^\+?961|^0/, '')) ||
            o.customer.email.toLowerCase().includes(q)
        );
      }
      if (query.status) rows = rows.filter((o) => o.status === query.status);
      if (query.paymentStatus) rows = rows.filter((o) => o.paymentStatus === query.paymentStatus);
      if (query.from) rows = rows.filter((o) => o.createdAt >= new Date(query.from).toISOString());
      if (query.to) rows = rows.filter((o) => o.createdAt <= new Date(new Date(query.to).getTime() + 86400000 - 1).toISOString());
      rows = [...rows].sort((a, b) => (query.sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
      const counts = Object.fromEntries(Object.keys(ORDER_STATUSES).map((s) => [s, db.orders.filter((o) => o.status === s).length]));
      return { ...paginate(rows.map((o) => serializeOrder(o, { admin: true })), query.page, query.pageSize || 15), counts };
    },
    ADMIN
  );

  router.get('/admin/orders/:id', ({ db, params }) => serializeOrder(findOrder(db, params.id), { admin: true }), ADMIN);

  router.post(
    '/admin/orders/:id/status',
    ({ db, params, body, user }) => {
      const order = findOrder(db, params.id);
      const next = body?.status;
      if (!ORDER_STATUSES[next]) throw new HttpError(400, 'Unknown status.');
      if (next === 'cancelled' || next === 'returned') throw new HttpError(400, 'Use the cancel or return action for this change.');
      if (!STATUS_TRANSITIONS[order.status]?.includes(next))
        throw new HttpError(409, `An order that is ${ORDER_STATUSES[order.status].label.toLowerCase()} cannot move to ${ORDER_STATUSES[next].label.toLowerCase()}.`);
      order.status = next;
      stamp(order, next, body?.note, user.fullName);
      // Courier collects cash on delivery.
      if (next === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        order.history[order.history.length - 1].note = [body?.note, 'Cash collected on delivery.'].filter(Boolean).join(' ');
      }
      return serializeOrder(order, { admin: true });
    },
    ADMIN
  );

  router.post(
    '/admin/orders/:id/payment',
    ({ db, params, body, user }) => {
      const order = findOrder(db, params.id);
      if (!['pending', 'paid'].includes(body?.paymentStatus)) throw new HttpError(400, 'Payment status can be set to pending or paid. Use refunds for money returned.');
      if (['cancelled', 'returned'].includes(order.status)) throw new HttpError(409, 'Payment cannot be changed on a closed order.');
      order.paymentStatus = body.paymentStatus;
      order.notes.push({ id: newId('nt'), text: `Payment marked as ${body.paymentStatus}.`, at: new Date().toISOString(), author: user.fullName, system: true });
      order.updatedAt = new Date().toISOString();
      return serializeOrder(order, { admin: true });
    },
    ADMIN
  );

  router.post(
    '/admin/orders/:id/cancel',
    ({ db, params, body, user }) => {
      const order = findOrder(db, params.id);
      if (!CANCELLABLE_STATUSES.includes(order.status)) throw new HttpError(409, 'Only orders that have not shipped can be cancelled. Use a return for delivered orders.');
      const restocked = body?.restock !== false ? restoreOrderInventory(db, order, { by: user.fullName, reason: 'Order cancelled' }) : false;
      order.status = 'cancelled';
      order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : 'voided';
      if (order.paymentStatus === 'refunded') order.refunds.push({ id: newId('rf'), amount: order.total, reason: 'Order cancelled', restocked, at: new Date().toISOString() });
      stamp(order, 'cancelled', [body?.reason, restocked ? 'Items returned to stock.' : ''].filter(Boolean).join(' '), user.fullName);
      return serializeOrder(order, { admin: true });
    },
    ADMIN
  );

  // Records a refund. `markReturned` closes a delivered order as returned; `restock` puts items
  // back once — repeated calls cannot double-restore inventory.
  router.post(
    '/admin/orders/:id/refunds',
    ({ db, params, body, user }) => {
      const order = findOrder(db, params.id);
      if (!['delivered', 'returned', 'out_for_delivery', 'shipped'].includes(order.status)) throw new HttpError(409, 'Refunds and returns are recorded on shipped or delivered orders. Cancel unshipped orders instead.');
      const refunded = order.refunds.reduce((s, r) => s + r.amount, 0);
      const remaining = roundMoney(order.total - refunded);
      const amount = roundMoney(Number(body?.amount));
      if (!(amount >= 0) || amount > remaining) throw new HttpError(400, `Refund must be between $0 and $${remaining.toFixed(2)}.`, { errors: { amount: `Maximum $${remaining.toFixed(2)}` } });
      if (!body?.reason?.trim()) throw new HttpError(400, 'Add a reason for the refund.', { errors: { reason: 'Required' } });
      let restocked = false;
      if (body.restock) {
        if (order.inventoryRestored) throw new HttpError(409, 'Items from this order were already returned to stock.');
        restocked = restoreOrderInventory(db, order, { by: user.fullName, reason: 'Customer return' });
      }
      order.refunds.push({ id: newId('rf'), amount, reason: body.reason.trim(), restocked, at: new Date().toISOString() });
      const totalRefunded = roundMoney(refunded + amount);
      if (amount > 0) order.paymentStatus = totalRefunded >= order.total ? 'refunded' : 'partially_refunded';
      if (body.markReturned && order.status === 'delivered') {
        order.status = 'returned';
        stamp(order, 'returned', body.reason.trim(), user.fullName);
      } else {
        order.updatedAt = new Date().toISOString();
      }
      return serializeOrder(order, { admin: true });
    },
    ADMIN
  );

  router.post(
    '/admin/orders/:id/notes',
    ({ db, params, body, user }) => {
      const order = findOrder(db, params.id);
      const text = String(body?.text || '').trim();
      if (!text) throw new HttpError(400, 'Write a note first.', { errors: { text: 'Required' } });
      if (text.length > 500) throw new HttpError(400, 'Notes are limited to 500 characters.');
      order.notes.push({ id: newId('nt'), text, at: new Date().toISOString(), author: user.fullName });
      return serializeOrder(order, { admin: true });
    },
    ADMIN
  );
}
