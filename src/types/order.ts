export type PaymentMethodId = "cod" | "card";

export interface CartLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  freeDeliveryApplied: boolean;
  /** True when any price or fee involved is still a placeholder. */
  containsPlaceholders: boolean;
}

export interface PricedLine extends CartLine {
  name: string;
  variantName?: string;
  unitPrice: number;
  lineTotal: number;
  isPlaceholderPrice: boolean;
}

export type CheckoutMode = "live" | "demo";

export interface OrderResponse {
  mode: CheckoutMode;
  /** Order reference — only present when an order was actually recorded. */
  reference?: string;
  /** Redirect to a hosted payment page (online payments). */
  redirectUrl?: string;
  totals: OrderTotals;
}
