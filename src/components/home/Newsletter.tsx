"use client";

import { useState } from "react";
import Link from "next/link";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "done"; demo: boolean } | { kind: "error"; message: string };

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    setErrors({});
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.fields ?? {});
        setStatus({ kind: "error", message: data.error ?? "Something went wrong." });
        return;
      }
      setStatus({ kind: "done", demo: data.mode === "demo" });
    } catch {
      setStatus({ kind: "error", message: "We couldn't reach the server. Please try again." });
    }
  }

  return (
    <section aria-labelledby="newsletter-title" className="bg-rose/60 py-[var(--spacing-section)]">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">The AURELLE Letter</p>
          <h2 id="newsletter-title" className="mt-6 text-headline font-light">
            A Little More AURELLE in Your Inbox.
          </h2>
          <p className="mt-6 text-[1.05rem] leading-relaxed text-stone">
            Discover self-care rituals, product news, and moments worth slowing down for.
          </p>

          {status.kind === "done" ? (
            <div className="mt-12" role="status">
              <p className="font-serif text-3xl italic">Thank you — welcome to the list.</p>
              {status.demo && (
                <p className="mt-3 text-xs tracking-[0.14em] text-stone uppercase">
                  Demo mode · Email storage is not configured, so this sign-up was not saved.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-12 text-left">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "newsletter-email-error" : undefined}
                    className="field-input"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={status.kind === "loading"}>
                  {status.kind === "loading" ? "Joining…" : "Join the List"}
                </button>
              </div>
              {errors.email && (
                <p id="newsletter-email-error" className="mt-2 text-sm text-error">
                  {errors.email}
                </p>
              )}
              <label className="mt-6 flex cursor-pointer items-start gap-3 text-[0.8rem] leading-relaxed text-stone">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-invalid={!!errors.consent}
                  className="mt-1 h-4 w-4 shrink-0 accent-ink"
                />
                <span>
                  I would like to receive emails from AURELLE about rituals, products and offers. I can unsubscribe at any
                  time. Read our{" "}
                  <Link href="/policies/privacy" className="text-ink underline underline-offset-4">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.consent && <p className="mt-2 text-sm text-error">{errors.consent}</p>}
              {status.kind === "error" && !Object.keys(errors).length && (
                <p className="mt-4 text-sm text-error" role="alert">
                  {status.message}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
