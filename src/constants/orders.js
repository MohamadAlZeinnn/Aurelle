// Order and payment status vocabulary. `tone` maps to semantic badge colours.
export const ORDER_STATUSES = {
  pending: { label: 'Pending', tone: 'amber', description: 'Order received and awaiting confirmation.' },
  confirmed: { label: 'Confirmed', tone: 'slate', description: 'We have confirmed your order by phone or message.' },
  processing: { label: 'Processing', tone: 'slate', description: 'Your items are being picked from our stock.' },
  packed: { label: 'Packed', tone: 'slate', description: 'Your order is packed and ready for the courier.' },
  shipped: { label: 'Shipped', tone: 'bronze', description: 'Handed over to our delivery partner.' },
  out_for_delivery: { label: 'Out for delivery', tone: 'bronze', description: 'The courier is on the way to your address.' },
  delivered: { label: 'Delivered', tone: 'sage', description: 'Delivered. We hope you enjoy it.' },
  cancelled: { label: 'Cancelled', tone: 'rosewood', description: 'This order was cancelled.' },
  returned: { label: 'Returned', tone: 'neutral', description: 'This order was returned.' },
};

// Linear fulfilment path used by the tracking timeline.
export const FULFILLMENT_FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

// Allowed manual transitions from each status (admin). Cancel/return are handled by dedicated actions.
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing', 'packed'];

export const PAYMENT_STATUSES = {
  pending: { label: 'Awaiting payment', tone: 'amber' },
  paid: { label: 'Paid', tone: 'sage' },
  partially_refunded: { label: 'Partially refunded', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  voided: { label: 'Voided', tone: 'neutral' },
};

export const PAYMENT_METHODS = {
  cod: { label: 'Cash on delivery', short: 'COD' },
  manual: { label: 'Manual transfer', short: 'Transfer' },
};
