import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Button } from '../../components/ui/index.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function NotFoundPage() {
  usePageMeta({ title: 'Page not found', noindex: true });
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 font-display text-[2.5rem] leading-tight sm:text-[3.5rem]">This page has wandered off.</h1>
      <p className="mt-4 max-w-md text-[15px] text-espresso-soft">The link may be outdated or the product may no longer be part of our collection.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button to="/shop">Browse the shop</Button>
        <Button to="/" variant="secondary">
          Return home
        </Button>
      </div>
    </section>
  );
}

/** Top-level error boundary for unexpected render errors and failed lazy chunks. */
export function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  const chunkFailed = /dynamically imported module|Loading chunk/i.test(String(error?.message));
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <Link to="/" className="font-display text-[1.8rem] tracking-[0.34em]">
        LUMA
      </Link>
      <h1 className="mt-10 font-display text-[2.2rem]">Something didn’t load properly.</h1>
      <p className="mt-3 max-w-md text-[15px] text-espresso-soft">
        {chunkFailed ? 'A new version of the shop may have been released. Refreshing the page usually fixes this.' : 'Please refresh the page. Your bag is saved on this device.'}
      </p>
      <div className="mt-8 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Refresh page
        </button>
        <a href="/" className="btn btn-secondary">
          Go home
        </a>
      </div>
    </div>
  );
}
