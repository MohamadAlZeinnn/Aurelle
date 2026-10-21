import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// The cart only stores identifiers and quantities. Prices, names and availability always
// come from the server quote, so stale client data can never be charged.
const MAX_PER_LINE = 10;

export const useCartStore = create(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,
      governorate: null,
      notices: [],

      /**
       * Adds a variant. `available` is the stock the shopper saw; the server re-checks.
       * @returns {{ ok: boolean, quantity: number, reason?: 'max' | 'unavailable' }}
       */
      addItem({ productId, variantId, quantity = 1, available = MAX_PER_LINE }) {
        const cap = Math.min(MAX_PER_LINE, Math.max(0, available));
        if (cap <= 0) return { ok: false, quantity: 0, reason: 'unavailable' };
        const existing = get().lines.find((l) => l.variantId === variantId);
        const current = existing?.quantity ?? 0;
        const next = Math.min(cap, current + quantity);
        if (next === current) return { ok: false, quantity: current, reason: 'max' };
        set((s) => ({
          lines: existing
            ? s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: next } : l))
            : [...s.lines, { productId, variantId, quantity: next, addedAt: Date.now() }],
        }));
        return { ok: true, quantity: next, clamped: current + quantity > next };
      },

      setQuantity(variantId, quantity) {
        const q = Math.max(1, Math.min(MAX_PER_LINE, Math.floor(quantity)));
        set((s) => ({ lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l)) }));
      },

      removeItem(variantId) {
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId), notices: s.notices.filter((n) => n.variantId !== variantId) }));
      },

      /** Swap the selected variant on a line (e.g. a different size), merging duplicates. */
      changeVariant(fromVariantId, toVariantId) {
        if (fromVariantId === toVariantId) return;
        set((s) => {
          const from = s.lines.find((l) => l.variantId === fromVariantId);
          if (!from) return s;
          const target = s.lines.find((l) => l.variantId === toVariantId);
          const lines = s.lines
            .filter((l) => l.variantId !== fromVariantId)
            .map((l) => (l.variantId === toVariantId ? { ...l, quantity: Math.min(MAX_PER_LINE, l.quantity + from.quantity) } : l));
          if (!target) lines.splice(s.lines.indexOf(from), 0, { ...from, variantId: toVariantId });
          return { lines };
        });
      },

      applyCoupon: (code) => set({ couponCode: code ? code.trim().toUpperCase() : null }),
      removeCoupon: () => set({ couponCode: null }),
      setGovernorate: (governorate) => set({ governorate }),
      clear: () => set({ lines: [], couponCode: null, notices: [] }),
      dismissNotice: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),

      /**
       * Reconciles the cart with a server quote. Quantities above available stock are reduced
       * and explained; sold-out lines stay in the bag (flagged) until the shopper removes them.
       */
      syncWithQuote(quote) {
        const adjustments = quote.items.filter((i) => i.status === 'adjusted' && i.available > 0);
        if (!adjustments.length) return;
        set((s) => ({
          lines: s.lines.map((l) => {
            const adj = adjustments.find((a) => a.variantId === l.variantId);
            return adj ? { ...l, quantity: adj.available } : l;
          }),
          notices: [
            ...s.notices.filter((n) => !adjustments.some((a) => a.variantId === n.variantId)),
            ...adjustments.map((a) => ({
              id: `${a.variantId}-${Date.now()}`,
              variantId: a.variantId,
              message: `We updated ${a.name}${a.variantName ? ` (${a.variantName})` : ''} from ${a.quantity} to ${a.available} — that’s all we have in stock right now.`,
            })),
          ],
        }));
      },
    }),
    {
      name: 'luma.cart.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, couponCode: s.couponCode, governorate: s.governorate, notices: s.notices }),
    }
  )
);

export const selectCartCount = (s) => s.lines.reduce((sum, l) => sum + l.quantity, 0);
export const CART_MAX_PER_LINE = MAX_PER_LINE;
