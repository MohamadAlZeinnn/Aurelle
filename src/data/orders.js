// Sample orders: 12 hand-written orders across every fulfilment stage, plus a
// deterministic set of older delivered orders so dashboard trends have history.
import { products } from './products.js';
import { settings } from './store.js';
import { computeTotals } from '../lib/pricing.js';
import { FULFILLMENT_FLOW } from '../constants/orders.js';

const productById = Object.fromEntries(products.map((p) => [p.id, p]));

function line(productId, variantId, quantity) {
  const p = productById[productId];
  const v = p.variants.find((x) => x.id === variantId) ?? p.variants[0];
  return {
    productId: p.id,
    variantId: v.id,
    name: p.name,
    variantName: v.name === 'Default' ? null : v.name,
    sku: v.sku,
    image: v.image || p.images[0],
    categoryId: p.categoryId,
    unitPrice: v.price,
    quantity,
    lineTotal: v.price * quantity,
  };
}

const addHours = (iso, h) => new Date(new Date(iso).getTime() + h * 3600 * 1000).toISOString();

function buildHistory(status, createdAt) {
  const history = [{ status: 'pending', at: createdAt, note: 'Order placed online.', by: 'Customer' }];
  if (status === 'cancelled') {
    history.push({ status: 'cancelled', at: addHours(createdAt, 5), note: 'Cancelled at customer request by phone.', by: 'Rima S.' });
    return history;
  }
  const end = status === 'returned' ? 'delivered' : status;
  const idx = FULFILLMENT_FLOW.indexOf(end);
  const gaps = [0, 3, 18, 22, 26, 44, 50];
  for (let i = 1; i <= idx; i++) history.push({ status: FULFILLMENT_FLOW[i], at: addHours(createdAt, gaps[i]), note: '', by: 'Rima S.' });
  if (status === 'returned') history.push({ status: 'returned', at: addHours(createdAt, 120), note: 'Returned unopened within 14 days.', by: 'Rima S.' });
  return history;
}

function order({ n, createdAt, status, customer, customerId = null, address, items, paymentMethod = 'cod', couponCode = null, discount = 0, notes = [] }) {
  const totals = computeTotals({
    items,
    settings,
    governorate: address.governorate,
    couponResult: couponCode ? { valid: true, discount, freeShipping: couponCode === 'LUMADELIVERY' } : null,
  });
  const delivered = status === 'delivered' || status === 'returned';
  let paymentStatus = delivered ? 'paid' : 'pending';
  if (status === 'returned') paymentStatus = 'refunded';
  if (status === 'cancelled') paymentStatus = 'voided';
  if (paymentMethod === 'manual' && ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(status)) paymentStatus = 'paid';
  const history = buildHistory(status, createdAt);
  return {
    id: `ord_${n}`,
    reference: `LUMA-${n}`,
    createdAt,
    updatedAt: history[history.length - 1].at,
    customerId,
    customer,
    shippingAddress: address,
    items,
    couponCode,
    ...totals,
    currency: 'USD',
    paymentMethod,
    paymentStatus,
    status,
    history,
    notes,
    refunds: status === 'returned' ? [{ id: `rf_${n}`, amount: totals.total, reason: 'Returned unopened', restocked: true, at: history[history.length - 1].at }] : [],
    inventoryRestored: status === 'cancelled' || status === 'returned',
    source: 'web',
  };
}

const layla = { fullName: 'Layla Haddad', phone: '+96171234567', email: 'layla@example.com' };
const laylaHome = {
  governorate: 'beirut', district: 'Beirut', city: 'Achrafieh', street: 'Rue Abdel Wahab El Inglizi, near Sursock',
  building: 'Bldg. Nour, Block B', floor: '4', landmark: 'Opposite the pharmacy', instructions: 'Please call before arriving.',
};
const maya = { fullName: 'Maya Khoury', phone: '+9613456789', email: 'maya.khoury@example.com' };
const mayaHome = { governorate: 'mount-lebanon', district: 'Keserwan', city: 'Jounieh', street: 'Kaslik main street', building: 'Villa 12', floor: 'Ground', landmark: 'Behind USEK gate 2', instructions: '' };

const addr = (governorate, district, city, street, building, floor = '', landmark = '') => ({ governorate, district, city, street, building, floor, landmark, instructions: '' });

export const handcraftedOrders = [
  order({
    n: 10248, createdAt: '2026-10-20T17:42:00.000Z', status: 'pending',
    customer: { fullName: 'Rania Saab', phone: '+96176543210', email: 'rania.saab@example.com' },
    address: addr('mount-lebanon', 'Baabda', 'Hazmieh', 'Mar Takla street', 'Bldg. Cedars', '2', 'Near Spinneys'),
    items: [line('p_gold_patches', 'v_gold_60', 1), line('p_peptide_eye_cream', 'v_pec_15', 1)],
  }),
  order({
    n: 10247, createdAt: '2026-10-20T11:05:00.000Z', status: 'pending',
    customer: { fullName: 'Yasmine Aoun', phone: '+96178901234', email: 'yasmine.aoun@example.com' },
    address: addr('north', 'Batroun', 'Batroun', 'Old souk road', 'House 4', '', 'Next to St. Stephen church'),
    items: [line('p_lip_oil', 'v_tlo_fig', 2), line('p_shea_balm', 'v_slb_berry', 1)], paymentMethod: 'manual',
  }),
  order({
    n: 10246, createdAt: '2026-10-19T20:15:00.000Z', status: 'confirmed', customerId: 'u_layla', customer: layla, address: laylaHome,
    items: [line('p_hyaluronic_serum', 'v_hws_50', 1), line('p_gel_cream', 'v_hgc_50', 1)], couponCode: 'WELCOME10', discount: 8.4,
    notes: [{ id: 'nt_1', text: 'Customer asked for delivery after 5pm.', at: '2026-10-19T21:00:00.000Z', author: 'Rima S.' }],
  }),
  order({
    n: 10245, createdAt: '2026-10-19T09:30:00.000Z', status: 'processing',
    customer: { fullName: 'Nour El Hajj', phone: '+96181222333', email: 'nour.h@example.com' },
    address: addr('south', 'Saida', 'Saida', 'Riad El Solh street', 'Bldg. Bahri', '5'),
    items: [line('p_vitc_serum', 'v_vcs_30', 1), line('p_niacinamide_serum', 'v_ncs_30', 1), line('p_rice_sheet_mask', 'v_rsm_5', 1)],
  }),
  order({
    n: 10244, createdAt: '2026-10-18T15:12:00.000Z', status: 'packed',
    customer: { fullName: 'Carla Nassar', phone: '+96170555444', email: 'carla.nassar@example.com' },
    address: addr('mount-lebanon', 'Jbeil', 'Byblos', 'Jbeil highway exit', 'Byblos Sud tower', '3'),
    items: [line('p_quartz_roller', 'v_rqr_1', 1), line('p_rose_oil', 'v_sro_30', 1)],
  }),
  order({
    n: 10243, createdAt: '2026-10-17T13:48:00.000Z', status: 'shipped', customerId: 'u_maya', customer: maya, address: mayaHome,
    items: [line('p_peptide_night', 'v_pnc_50', 1), line('p_retinal_eye_balm', 'v_rnb_30', 1)],
  }),
  order({
    n: 10242, createdAt: '2026-10-16T10:22:00.000Z', status: 'out_for_delivery',
    customer: { fullName: 'Hiba Fakih', phone: '+96179333111', email: 'hiba.fakih@example.com' },
    address: addr('bekaa', 'Zahle', 'Zahle', 'Boulevard Brazil', 'Bldg. Grand Kadri', '1'),
    items: [line('p_gold_patches', 'v_gold_120', 1)], couponCode: 'LUMADELIVERY',
  }),
  order({
    n: 10241, createdAt: '2026-10-12T18:03:00.000Z', status: 'delivered', customerId: 'u_layla', customer: layla, address: laylaHome,
    items: [line('p_lip_oil', 'v_tlo_petal', 1), line('p_headband', 'v_hb_ivory', 1), line('p_silk_mask', 'v_msm_1', 1)],
  }),
  order({
    n: 10240, createdAt: '2026-10-08T12:40:00.000Z', status: 'delivered',
    customer: { fullName: 'Joelle Rizk', phone: '+9613777888', email: 'joelle.rizk@example.com' },
    address: addr('beirut', 'Beirut', 'Hamra', 'Makdessi street', 'Bldg. Saab', '6', 'Above the bakery'),
    items: [line('p_gel_cream', 'v_hgc_50', 1), line('p_hyaluronic_serum', 'v_hws_30', 1), line('p_lip_mask', 'v_olm_20', 1)],
  }),
  order({
    n: 10239, createdAt: '2026-10-04T09:15:00.000Z', status: 'delivered',
    customer: { fullName: 'Dina Mansour', phone: '+96171999000', email: 'dina.mansour@example.com' },
    address: addr('nabatieh', 'Nabatieh', 'Nabatieh', 'Hassan Kamel El Sabbah street', 'Bldg. Jaber', '2'),
    items: [line('p_peptide_eye_cream', 'v_pec_15', 2)],
  }),
  order({
    n: 10238, createdAt: '2026-10-02T16:55:00.000Z', status: 'cancelled',
    customer: { fullName: 'Sara Chamoun', phone: '+96176111222', email: 'sara.chamoun@example.com' },
    address: addr('mount-lebanon', 'Chouf', 'Deir el Qamar', 'Main square', 'House 18'),
    items: [line('p_rose_patches', 'v_rose_60', 2)],
  }),
  order({
    n: 10237, createdAt: '2026-09-26T14:30:00.000Z', status: 'returned', customerId: 'u_layla', customer: layla, address: laylaHome,
    items: [line('p_barrier_moist', 'v_rbm_50', 1)],
  }),
];

// Deterministic PRNG so the generated history is identical on every machine.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HISTORY_CUSTOMERS = [
  ['Lara Bou Khalil', '+96170222333', 'lara.bk@example.com', addr('beirut', 'Beirut', 'Mar Mikhael', 'Armenia street', 'Bldg. 22', '3')],
  ['Tala Barakat', '+96171444555', 'tala.b@example.com', addr('mount-lebanon', 'Matn', 'Antelias', 'Antelias highway', 'Le Mall offices', '2')],
  ['Nadine Tannous', '+96176777888', 'nadine.t@example.com', addr('north', 'Tripoli', 'Tripoli', 'Azmi street', 'Bldg. Karami', '4')],
  ['Reem Hamdan', '+96181555666', 'reem.h@example.com', addr('mount-lebanon', 'Aley', 'Aley', 'Main road', 'House 7')],
  ['Christelle Abi Nader', '+9613222111', 'christelle.an@example.com', addr('mount-lebanon', 'Keserwan', 'Zouk Mosbeh', 'Zouk main road', 'Bldg. Rose', '1')],
  ['Farah Itani', '+96178444333', 'farah.i@example.com', addr('beirut', 'Beirut', 'Verdun', 'Rashid Karami street', 'Verdun Plaza', '8')],
  ['Mira Gemayel', '+96170888999', 'mira.g@example.com', addr('mount-lebanon', 'Baabda', 'Baabda', 'Presidential palace road', 'Bldg. Haddad', '2')],
  ['Zeina Moussa', '+96171666777', 'zeina.m@example.com', addr('south', 'Tyre', 'Tyre', 'Corniche', 'Bldg. Sea View', '3')],
];

const POPULAR = [
  ['p_hyaluronic_serum', 'v_hws_30'], ['p_gel_cream', 'v_hgc_50'], ['p_gold_patches', 'v_gold_60'], ['p_peptide_eye_cream', 'v_pec_15'],
  ['p_lip_oil', 'v_tlo_fig'], ['p_vitc_serum', 'v_vcs_30'], ['p_quartz_roller', 'v_rqr_1'], ['p_honey_sleep_mask', 'v_hsm_60'],
  ['p_niacinamide_serum', 'v_ncs_30'], ['p_rice_sheet_mask', 'v_rsm_5'], ['p_rose_patches', 'v_rose_60'], ['p_headband', 'v_hb_ivory'],
];

export function generateHistoricalOrders(count = 36) {
  const rand = mulberry32(2026);
  const out = [];
  for (let i = 0; i < count; i++) {
    const [fullName, phone, email, address] = HISTORY_CUSTOMERS[Math.floor(rand() * HISTORY_CUSTOMERS.length)];
    const daysAgo = 6 + Math.floor((i / count) * 54 + rand() * 2);
    const createdAt = new Date(Date.UTC(2026, 9, 20, 9 + Math.floor(rand() * 10), Math.floor(rand() * 60)) - daysAgo * 86400000).toISOString();
    const lines = [];
    const n = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const [pid, vid] = POPULAR[Math.floor(rand() * POPULAR.length)];
      if (!lines.find((l) => l.variantId === vid)) lines.push(line(pid, vid, 1 + (rand() > 0.85 ? 1 : 0)));
    }
    out.push(order({ n: 10200 + (count - i), createdAt, status: 'delivered', customer: { fullName, phone, email }, address, items: lines }));
  }
  return out;
}

export const orders = [...handcraftedOrders, ...generateHistoricalOrders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const inventoryLog = [
  { id: 'adj_1', productId: 'p_hyaluronic_serum', variantId: 'v_hws_30', sku: 'LUM-SER-HWS-30', type: 'restock', delta: 24, before: 6, after: 30, note: 'Supplier delivery PO-2291', by: 'Rima S.', at: '2026-10-06T10:00:00.000Z' },
  { id: 'adj_2', productId: 'p_gold_patches', variantId: 'v_gold_60', sku: 'LUM-EYE-GLD-60', type: 'restock', delta: 36, before: 8, after: 44, note: 'Supplier delivery PO-2290', by: 'Rima S.', at: '2026-10-06T10:05:00.000Z' },
  { id: 'adj_3', productId: 'p_vitc_serum', variantId: 'v_vcs_30', sku: 'VER-SER-VCS-30', type: 'damage', delta: -1, before: 4, after: 3, note: 'Bottle cracked in storage', by: 'Rima S.', at: '2026-10-11T15:30:00.000Z' },
  { id: 'adj_4', productId: 'p_headband', variantId: 'v_hb_blush', sku: 'LUM-ACC-HDB-BLS', type: 'correction', delta: -2, before: 2, after: 0, note: 'Stock count correction after audit', by: 'Rima S.', at: '2026-10-13T09:00:00.000Z' },
  { id: 'adj_5', productId: 'p_bakuchiol_serum', variantId: 'v_brs_50', sku: 'VER-SER-BRS-50', type: 'correction', delta: 0, before: 0, after: 0, note: 'Size discontinued by brand', by: 'Rima S.', at: '2026-10-14T12:00:00.000Z' },
  { id: 'adj_6', productId: 'p_barrier_moist', variantId: 'v_rbm_50', sku: 'VER-MOI-RBM-50', type: 'return', delta: 1, before: 7, after: 8, note: 'Returned unopened — order LUMA-10237', by: 'Rima S.', at: '2026-10-01T14:30:00.000Z' },
];
