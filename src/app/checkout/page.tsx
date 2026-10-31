import type { Metadata } from "next";
import { getCheckoutStatus } from "@/lib/server/checkout-mode";
import { getAvailablePaymentMethods } from "@/lib/server/payments";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

// Payment availability and demo/live mode depend on server environment variables.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const status = getCheckoutStatus();
  const methods = getAvailablePaymentMethods();
  return <CheckoutForm mode={status.mode} demoReasons={status.reasons} paymentMethods={methods} />;
}
