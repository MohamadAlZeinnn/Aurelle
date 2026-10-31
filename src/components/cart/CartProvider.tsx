"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { cartReducer, CART_STORAGE_KEY, loadCart, saveCart } from "@/lib/cart";
import { computeTotals, priceLines } from "@/lib/pricing";
import type { CartLine, OrderTotals, PricedLine } from "@/types/order";

interface CartContextValue {
  lines: CartLine[];
  priced: PricedLine[];
  totals: OrderTotals;
  count: number;
  /** False until localStorage has been read — avoids flashing an empty cart. */
  hydrated: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (productId: string, quantity?: number, variantId?: string) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  remove: (productId: string, variantId?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch({ type: "replace", lines: loadCart() });
    setHydrated(true);
    // Keep multiple tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) dispatch({ type: "replace", lines: loadCart() });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(lines);
  }, [lines, hydrated]);

  const add = useCallback((productId: string, quantity = 1, variantId?: string) => {
    dispatch({ type: "add", productId, variantId, quantity });
    setIsOpen(true);
  }, []);
  const setQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => dispatch({ type: "setQuantity", productId, variantId, quantity }),
    [],
  );
  const remove = useCallback((productId: string, variantId?: string) => dispatch({ type: "remove", productId, variantId }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => {
    const priced = priceLines(lines);
    return {
      lines,
      priced,
      totals: computeTotals(priced),
      count: priced.reduce((n, l) => n + l.quantity, 0),
      hydrated,
      isOpen,
      open,
      close,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, hydrated, isOpen, open, close, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
