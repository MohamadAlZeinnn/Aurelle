import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false },
};

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ ref?: string; mode?: string }> }) {
  const { ref, mode } = await searchParams;
  const reference = ref && /^AUR-\d{6}-[A-F0-9]{6}$/.test(ref) ? ref : null;
  const isDemo = mode === "demo" || !reference;

  return (
    <section className="py-24 md:py-36">
      <div className="container-site max-w-2xl text-center">
        {isDemo ? (
          <>
            <p className="eyebrow">Demo checkout</p>
            <h1 className="mt-6 text-headline font-light">Your details look good.</h1>
            <p className="mx-auto mt-6 max-w-md text-[1.05rem] leading-relaxed text-stone">
              This store is running in demo mode, so <strong className="font-medium text-ink">no order was placed</strong> and no payment
              was taken. Your bag has been kept as it was.
            </p>
            <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/cart" className="btn btn-primary">
                Back to Bag
              </Link>
              <Link href="/" className="btn btn-secondary">
                Return Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Thank you</p>
            <h1 className="mt-6 text-headline font-light">Your ritual is on its way.</h1>
            <p className="mt-8 text-sm tracking-[0.16em] text-stone uppercase">Order reference</p>
            <p className="mt-2 font-serif text-3xl tracking-wide">{reference}</p>
            <p className="mx-auto mt-8 max-w-md text-[1.05rem] leading-relaxed text-stone">
              We have received your order. Our team will contact you by phone to confirm the details before delivery. Please keep
              your reference for any questions.
            </p>
            <Link href="/" className="btn btn-secondary mt-12">
              Return Home
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
