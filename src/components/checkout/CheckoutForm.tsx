"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { CartSummary } from "@/components/cart/CartSummary";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { Field } from "@/components/ui/Field";
import { formatUSD } from "@/lib/currency";
import { getProductById } from "@/lib/product";
import { checkoutSchema, fieldErrors, type CheckoutInput } from "@/lib/validation";
import { GOVERNORATES } from "@/data/lebanon";
import { siteConfig } from "@/data/site-config";
import type { CheckoutMode, OrderResponse, PaymentMethodId } from "@/types/order";

interface PaymentMethodOption {
  id: PaymentMethodId;
  label: string;
  description: string;
}

interface Props {
  mode: CheckoutMode;
  demoReasons: string[];
  paymentMethods: PaymentMethodOption[];
}

type FormValues = Omit<CheckoutInput, "paymentMethod" | "notes"> & { notes: string; paymentMethod: PaymentMethodId | "" };

export function CheckoutForm({ mode, demoReasons, paymentMethods }: Props) {
  const router = useRouter();
  const { lines, priced, totals, hydrated, clear } = useCart();
  const [values, setValues] = useState<FormValues>({
    fullName: "",
    email: "",
    phone: "",
    country: siteConfig.shipping.countries[0],
    city: "",
    area: "",
    street: "",
    notes: "",
    paymentMethod: paymentMethods.length === 1 ? paymentMethods[0].id : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors(({ [key]: _, ...rest }) => rest);
  };

  /** Validate a single field on blur so customers get feedback as they go. */
  const validateField = (key: keyof FormValues) => () => {
    const result = checkoutSchema.safeParse(values);
    const message = result.success ? undefined : fieldErrors(result.error)[key];
    setErrors(({ [key]: _, ...rest }) => (message && values[key] !== "" ? { ...rest, [key]: message } : rest));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      document.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: parsed.data, lines }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) {
          // Server field keys are prefixed with "customer.".
          setErrors(Object.fromEntries(Object.entries(data.fields as Record<string, string>).map(([k, v]) => [k.replace(/^customer\./, ""), v])));
        }
        setFormError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      const order = data as OrderResponse;
      if (order.redirectUrl) {
        window.location.assign(order.redirectUrl);
        return;
      }
      if (order.mode === "live" && order.reference) {
        clear();
        router.push(`/checkout/confirmation?ref=${encodeURIComponent(order.reference)}`);
      } else {
        router.push("/checkout/confirmation?mode=demo");
      }
    } catch {
      setFormError("We couldn't reach the server. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (hydrated && priced.length === 0) {
    return (
      <section className="py-24 text-center md:py-32">
        <div className="container-site">
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-6 text-headline font-light">Your bag is empty.</h1>
          <Link href="/shop" className="btn btn-primary mt-10">
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-10 pb-24 md:pt-16">
      <div className="container-site">
        {mode === "demo" && (
          <div role="note" className="mb-10 border border-dashed border-clay/60 bg-linen/70 px-5 py-4 text-sm text-clay">
            <p>
              <span className="mr-2 font-medium tracking-[0.16em] uppercase">Demo checkout</span>
              Your details will be validated, but no order will be placed and no payment taken.
            </p>
            {process.env.NODE_ENV !== "production" && (
              <ul className="mt-2 list-disc pl-5 text-xs text-stone">
                {demoReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-baseline justify-between border-b border-ink/10 pb-8">
          <h1 className="text-headline font-light">Checkout</h1>
          <Link href="/cart" className="text-xs tracking-[0.14em] text-stone uppercase hover:text-ink">
            Edit bag
          </Link>
        </div>

        <form onSubmit={onSubmit} noValidate className="grid gap-14 pt-10 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-14 lg:col-span-7">
            <fieldset>
              <legend className="font-serif text-2xl">Contact</legend>
              <div className="mt-6 grid gap-7 sm:grid-cols-2">
                <Field label="Full name" error={errors.fullName} className="sm:col-span-2">
                  {(p) => <input {...p} name="fullName" autoComplete="name" className="field-input" value={values.fullName} onChange={set("fullName")} onBlur={validateField("fullName")} />}
                </Field>
                <Field label="Email" error={errors.email}>
                  {(p) => <input {...p} name="email" type="email" inputMode="email" autoComplete="email" className="field-input" value={values.email} onChange={set("email")} onBlur={validateField("email")} />}
                </Field>
                <Field label="Phone number" error={errors.phone} hint="Lebanese mobile or landline — our courier will call before delivery.">
                  {(p) => (
                    <div className="flex items-center">
                      <span className="field-input !w-auto pr-3 text-stone" aria-hidden>
                        +961
                      </span>
                      <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="70 123 456" className="field-input" value={values.phone} onChange={set("phone")} onBlur={validateField("phone")} />
                    </div>
                  )}
                </Field>
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-serif text-2xl">Delivery</legend>
              <div className="mt-6 grid gap-7 sm:grid-cols-2">
                <Field label="Country" error={errors.country}>
                  {(p) => (
                    <select {...p} name="country" autoComplete="country-name" className="field-input" value={values.country} onChange={set("country")}>
                      {siteConfig.shipping.countries.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="City / District" error={errors.city}>
                  {(p) => (
                    <select {...p} name="city" className="field-input" value={values.city} onChange={set("city")} onBlur={validateField("city")}>
                      <option value="">Select…</option>
                      {GOVERNORATES.map((g) => (
                        <optgroup key={g.id} label={g.name}>
                          {g.districts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Area" error={errors.area} hint="e.g. Achrafieh, Hamra, Jal el Dib">
                  {(p) => <input {...p} name="area" autoComplete="address-level3" className="field-input" value={values.area} onChange={set("area")} onBlur={validateField("area")} />}
                </Field>
                <Field label="Street address" error={errors.street} hint="Street, building, floor — and a landmark if helpful">
                  {(p) => <input {...p} name="street" autoComplete="street-address" className="field-input" value={values.street} onChange={set("street")} onBlur={validateField("street")} />}
                </Field>
                <Field label="Delivery notes" optional error={errors.notes} className="sm:col-span-2">
                  {(p) => <textarea {...p} name="notes" rows={3} className="field-input" placeholder="Anything our courier should know" value={values.notes} onChange={set("notes")} />}
                </Field>
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-serif text-2xl">Payment</legend>
              {paymentMethods.length === 0 ? (
                <p className="mt-6 text-stone">No payment method is currently available. Please contact us to complete your order.</p>
              ) : (
                <div className="mt-6 space-y-3" role="radiogroup" aria-describedby={errors.paymentMethod ? "payment-error" : undefined}>
                  {paymentMethods.map((m) => (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-1 ${
                        values.paymentMethod === m.id ? "border-ink bg-white/60" : "border-ink/15 hover:border-ink/40"
                      }`}
                    >
                      <input type="radio" name="paymentMethod" value={m.id} checked={values.paymentMethod === m.id} onChange={set("paymentMethod")} className="mt-1 accent-ink" />
                      <span>
                        <span className="block text-[0.95rem]">{m.label}</span>
                        <span className="mt-1 block text-sm text-stone">{m.description}</span>
                      </span>
                    </label>
                  ))}
                  {!paymentMethods.some((m) => m.id === "card") && (
                    <p className="pt-1 text-xs text-stone">Online card payment will be available soon.</p>
                  )}
                  {errors.paymentMethod && (
                    <p id="payment-error" className="text-sm text-error">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>
              )}
            </fieldset>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-linen p-7 md:p-10 lg:sticky lg:top-28">
              <h2 className="font-serif text-2xl">Your Order</h2>
              <ul className="mt-6 divide-y divide-ink/10 border-b border-ink/10">
                {!hydrated ? (
                  <li className="h-24" aria-busy="true" />
                ) : (
                  priced.map((l) => {
                    const img = getProductById(l.productId)!.images[0];
                    return (
                      <li key={`${l.productId}-${l.variantId ?? ""}`} className="flex items-center gap-4 py-4">
                        <div className="relative">
                          <EditorialImage src={img.src} alt={img.alt} motif={img.motif} brief={img.brief} compact sizes="64px" className="aspect-[4/5] w-16" />
                          <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-ivory">{l.quantity}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-lg leading-tight">{l.name}</p>
                          {l.variantName && <p className="text-sm text-stone">{l.variantName}</p>}
                        </div>
                        <p className="text-sm tabular-nums">{formatUSD(l.lineTotal)}</p>
                      </li>
                    );
                  })
                )}
              </ul>
              <div className="mt-6">
                <CartSummary totals={totals} />
              </div>
              <button type="submit" className="btn btn-primary mt-8 w-full" disabled={submitting || !hydrated || paymentMethods.length === 0}>
                {submitting ? "Placing order…" : mode === "demo" ? "Place Demo Order" : "Place Order"}
              </button>
              {formError && (
                <p role="alert" className="mt-4 text-sm text-error">
                  {formError}
                </p>
              )}
              <p className="mt-5 flex items-center justify-center gap-2 text-xs text-stone">
                <Lock className="h-3 w-3" strokeWidth={1.5} aria-hidden /> Your details are sent securely and used only for your order.
              </p>
              <p className="mt-3 text-center text-xs text-stone">
                By placing your order you agree to our{" "}
                <Link href="/policies/terms" className="underline underline-offset-2">Terms</Link> and{" "}
                <Link href="/policies/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}
