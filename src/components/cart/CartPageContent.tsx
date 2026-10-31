"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary, FreeDeliveryProgress } from "@/components/cart/CartSummary";

export function CartPageContent() {
  const { priced, totals, hydrated, count } = useCart();

  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <div className="flex items-baseline justify-between border-b border-ink/10 pb-8">
          <h1 className="text-headline font-light">Your Bag</h1>
          {hydrated && count > 0 && (
            <p className="text-sm text-stone">
              {count} {count === 1 ? "item" : "items"}
            </p>
          )}
        </div>

        {!hydrated ? (
          <div className="h-64" aria-busy="true" />
        ) : priced.length === 0 ? (
          <div className="py-24 text-center">
            <p className="eyebrow">Your bag is empty</p>
            <p className="mx-auto mt-5 max-w-md font-serif text-3xl leading-tight">A little moment of calm is waiting for you.</p>
            <Link href="/shop" className="btn btn-primary mt-10">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 pt-4 lg:grid-cols-12 lg:gap-16">
            <ul className="divide-y divide-ink/10 lg:col-span-7">
              {priced.map((line) => (
                <CartItem key={`${line.productId}-${line.variantId ?? ""}`} line={line} />
              ))}
            </ul>
            <aside className="lg:col-span-5">
              <div className="bg-linen p-8 md:p-10 lg:sticky lg:top-28">
                <h2 className="font-serif text-2xl">Order Summary</h2>
                <div className="mt-6">
                  <FreeDeliveryProgress subtotal={totals.subtotal} />
                </div>
                <div className="mt-8">
                  <CartSummary totals={totals} />
                </div>
                <Link href="/checkout" className="btn btn-primary mt-8 w-full">
                  Proceed to Checkout
                </Link>
                <Link href="/shop" className="mt-5 block text-center text-xs tracking-[0.14em] text-stone uppercase hover:text-ink">
                  Continue shopping
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
