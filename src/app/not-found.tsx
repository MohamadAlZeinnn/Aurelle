import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-32 text-center md:py-44">
      <div className="container-site">
        <p className="eyebrow">404</p>
        <h1 className="mt-6 text-headline font-light">
          This page has <em>drifted off.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-sm text-stone">The page you were looking for could not be found. Take a breath — let&apos;s get you back.</p>
        <Link href="/" className="btn btn-primary mt-10">
          Return Home
        </Link>
      </div>
    </section>
  );
}
