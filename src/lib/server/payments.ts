import "server-only";
import { siteConfig } from "@/data/site-config";
import type { OrderTotals, PaymentMethodId, PricedLine } from "@/types/order";

/**
 * Payment architecture.
 *
 * Cash on Delivery needs no provider. Online card payments go through a
 * `PaymentProvider` adapter that creates a hosted payment session and returns
 * the URL to redirect the customer to. The order is stored as
 * `awaiting_payment` first and must only be marked paid by the provider's
 * server-to-server callback (webhook) — never by the browser redirect.
 *
 * To integrate a Lebanese acquirer (e.g. Areeba / Mastercard Gateway, or a
 * wallet such as Whish), implement the interface below, register it in
 * `providers`, and set PAYMENT_PROVIDER + credentials in the environment.
 */
export interface PaymentSessionRequest {
  reference: string;
  lines: PricedLine[];
  totals: OrderTotals;
  customer: { fullName: string; email: string; phone: string };
  returnUrl: string;
}

export interface PaymentProvider {
  id: string;
  label: string;
  isConfigured(): boolean;
  createSession(request: PaymentSessionRequest): Promise<{ redirectUrl: string }>;
}

// Register real adapters here once credentials are available.
const providers: Record<string, PaymentProvider> = {};

export function getCardProvider(): PaymentProvider | null {
  const id = process.env.PAYMENT_PROVIDER;
  const provider = id ? providers[id] : undefined;
  return provider?.isConfigured() ? provider : null;
}

export interface PaymentMethodOption {
  id: PaymentMethodId;
  label: string;
  description: string;
}

/** The payment methods that can actually be used right now. */
export function getAvailablePaymentMethods(): PaymentMethodOption[] {
  const methods: PaymentMethodOption[] = [];
  if (siteConfig.payments.cashOnDelivery) {
    methods.push({
      id: "cod",
      label: "Cash on Delivery",
      description: "Pay in USD when your order arrives.",
    });
  }
  const card = getCardProvider();
  if (card) {
    methods.push({ id: "card", label: "Card payment", description: `Secure payment via ${card.label}.` });
  }
  return methods;
}
