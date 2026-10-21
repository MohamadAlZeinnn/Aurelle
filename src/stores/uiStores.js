import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      toggle(id) {
        const exists = get().ids.includes(id);
        set((s) => ({ ids: exists ? s.ids.filter((x) => x !== id) : [id, ...s.ids] }));
        return !exists;
      },
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
    }),
    { name: 'luma.wishlist.v1', storage: createJSONStorage(() => localStorage) }
  )
);

export const useRecentlyViewedStore = create(
  persist(
    (set) => ({
      ids: [],
      push: (id) => set((s) => ({ ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, 8) })),
    }),
    { name: 'luma.recent.v1', storage: createJSONStorage(() => localStorage) }
  )
);

// Transient UI state (drawers, overlays, quick view).
export const useUiStore = create((set) => ({
  cartOpen: false,
  mobileNavOpen: false,
  searchOpen: false,
  quickViewSlug: null,
  openCart: () => set({ cartOpen: true, mobileNavOpen: false, searchOpen: false }),
  closeCart: () => set({ cartOpen: false }),
  setMobileNav: (open) => set({ mobileNavOpen: open }),
  setSearch: (open) => set({ searchOpen: open, mobileNavOpen: false }),
  openQuickView: (slug) => set({ quickViewSlug: slug }),
  closeQuickView: () => set({ quickViewSlug: null }),
}));

let toastId = 0;
export const useToastStore = create((set, get) => ({
  toasts: [],
  /** tone: 'default' | 'success' | 'error' */
  push(toast) {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, tone: 'default', duration: 4500, ...toast }] }));
    const duration = toast.duration ?? 4500;
    if (duration) setTimeout(() => get().dismiss(id), duration);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  show: (title, opts = {}) => useToastStore.getState().push({ title, ...opts }),
  success: (title, opts = {}) => useToastStore.getState().push({ title, tone: 'success', ...opts }),
  error: (title, opts = {}) => useToastStore.getState().push({ title, tone: 'error', duration: 6500, ...opts }),
};
