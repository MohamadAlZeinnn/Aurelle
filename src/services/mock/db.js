// In-browser demo database persisted to localStorage.
// This is a SIMULATION of the backend for demo mode only. It runs in the visitor's browser,
// so nothing here is secure or shared between visitors.
import { products } from '../../data/products.js';
import { categories, brands, concerns, attributes } from '../../data/categories.js';
import { users, reviews, restockRequests } from '../../data/people.js';
import { orders, inventoryLog } from '../../data/orders.js';
import { settings, coupons, content } from '../../data/store.js';

const STORAGE_KEY = 'luma.demo.db.v1';
const SCHEMA_VERSION = 1;

const clone = (v) => JSON.parse(JSON.stringify(v));

export function createSeed() {
  return clone({
    version: SCHEMA_VERSION,
    seededAt: new Date().toISOString(),
    products,
    categories,
    brands,
    concerns,
    attributes,
    users,
    reviews,
    orders,
    coupons,
    settings,
    content,
    inventoryLog,
    restockRequests,
    newsletter: [],
    sessions: {},
    idempotency: {},
    passwordResets: [],
  });
}

let db = null;

const storage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export function getDb() {
  if (db) return db;
  const raw = storage()?.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.version === SCHEMA_VERSION) db = parsed;
    } catch {
      /* corrupted storage → reseed */
    }
  }
  if (!db) {
    db = createSeed();
    persist();
  }
  return db;
}

/** @returns {boolean} false when the browser refused to store (e.g. quota exceeded) */
export function persist() {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch {
    return false;
  }
}

export function resetDb() {
  db = createSeed();
  persist();
  return db;
}

export const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
