import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { fieldErrors, normalizeLebanesePhone, orderRequestSchema } from "@/lib/validation";
import { computeTotals, priceLines } from "@/lib/pricing";
import { getProductById, isPurchasable } from "@/lib/product";
import { getCheckoutStatus } from "@/lib/server/checkout-mode";
import { getAvailablePaymentMethods, getCardProvider } from "@/lib/server/payments";
import { insertRow } from "@/lib/server/store";
import { siteConfig } from "@/data/site-config";
import type { OrderResponse } from "@/types/order";

function orderReference(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `AUR-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }
  const { customer, lines } = parsed.data;

  // Prices are always recomputed from the catalogue on the server.
  const priced = priceLines(lines);
  const unavailable = priced.find((l) => !isPurchasable(getProductById(l.productId)!, l.variantId));
  if (priced.length !== lines.length || unavailable) {
    return NextResponse.json(
      { error: "Some items in your bag are no longer available. Please review your bag." },
      { status: 409 },
    );
  }

  if (!getAvailablePaymentMethods().some((m) => m.id === customer.paymentMethod)) {
    return NextResponse.json(
      { error: "That payment method is not available.", fields: { paymentMethod: "Please choose another payment method." } },
      { status: 422 },
    );
  }

  const totals = computeTotals(priced);
  const status = getCheckoutStatus();

  if (status.mode === "demo") {
    // Validation passed, but nothing is recorded or charged.
    return NextResponse.json<OrderResponse>({ mode: "demo", totals });
  }

  const reference = orderReference();
  const phone = normalizeLebanesePhone(customer.phone)!;
  const isCard = customer.paymentMethod === "card";

  try {
    await insertRow("orders", {
      reference,
      status: isCard ? "awaiting_payment" : "pending",
      payment_method: customer.paymentMethod,
      currency: siteConfig.currency.primary,
      subtotal: totals.subtotal,
      delivery_fee: totals.deliveryFee,
      total: totals.total,
      lines: priced,
      full_name: customer.fullName,
      email: customer.email,
      phone,
      country: customer.country,
      city: customer.city,
      area: customer.area,
      street: customer.street,
      notes: customer.notes || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "We couldn't place your order just now. Please try again in a moment." },
      { status: 502 },
    );
  }

  if (isCard) {
    const provider = getCardProvider()!;
    try {
      const { redirectUrl } = await provider.createSession({
        reference,
        lines: priced,
        totals,
        customer: { fullName: customer.fullName, email: customer.email, phone },
        returnUrl: `${siteConfig.url}/checkout/confirmation?ref=${reference}`,
      });
      return NextResponse.json<OrderResponse>({ mode: "live", reference, redirectUrl, totals });
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: "We couldn't start the secure payment. Please try again or choose Cash on Delivery." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json<OrderResponse>({ mode: "live", reference, totals }, { status: 201 });
}
