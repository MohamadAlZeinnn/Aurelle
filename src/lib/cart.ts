import type { CartLine } from "@/types/order";
import { getProductById } from "@/lib/product";

export const CART_STORAGE_KEY = "aurelle.cart.v1";

export type CartAction =
  | { type: "add"; productId: string; variantId?: string; quantity: number }
  | { type: "setQuantity"; productId: string; variantId?: string; quantity: number }
  | { type: "remove"; productId: string; variantId?: string }
  | { type: "replace"; lines: CartLine[] }
  | { type: "clear" };

const sameLine = (a: Pick<CartLine, "productId" | "variantId">, b: Pick<CartLine, "productId" | "variantId">) =>
  a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

function clampQuantity(productId: string, quantity: number): number {
  const max = getProductById(productId)?.maxPerOrder ?? 10;
  return Math.max(0, Math.min(Math.floor(quantity), max));
}

export function cartReducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "add": {
      const existing = state.find((l) => sameLine(l, action));
      if (existing) {
        return state.map((l) =>
          sameLine(l, action) ? { ...l, quantity: clampQuantity(l.productId, l.quantity + action.quantity) } : l,
        );
      }
      const quantity = clampQuantity(action.productId, action.quantity);
      return quantity > 0
        ? [...state, { productId: action.productId, variantId: action.variantId, quantity }]
        : state;
    }
    case "setQuantity": {
      const quantity = clampQuantity(action.productId, action.quantity);
      return quantity === 0
        ? state.filter((l) => !sameLine(l, action))
        : state.map((l) => (sameLine(l, action) ? { ...l, quantity } : l));
    }
    case "remove":
      return state.filter((l) => !sameLine(l, action));
    case "replace":
      return sanitizeLines(action.lines);
    case "clear":
      return [];
  }
}

/** Drops malformed or no-longer-sold lines (e.g. from an old localStorage payload). */
export function sanitizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((l) => {
    if (!l || typeof l.productId !== "string" || typeof l.quantity !== "number") return [];
    const product = getProductById(l.productId);
    if (!product) return [];
    if (l.variantId && !product.variants.some((v) => v.id === l.variantId)) return [];
    const quantity = clampQuantity(l.productId, l.quantity);
    return quantity > 0 ? [{ productId: l.productId, variantId: l.variantId || undefined, quantity }] : [];
  });
}

export function loadCart(): CartLine[] {
  try {
    return sanitizeLines(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function saveCart(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable (private mode / quota) — the cart still works for this visit.
  }
}
