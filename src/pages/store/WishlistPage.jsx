import { Heart } from 'lucide-react';
import { Button, EmptyState, ErrorState } from '../../components/ui/index.js';
import { ProductGrid } from '../../components/product/ProductCard.jsx';
import { useProductsByIds } from '../../hooks/queries.js';
import { useWishlistStore } from '../../stores/uiStores.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function WishlistPage() {
  usePageMeta({ title: 'Wishlist', noindex: true });
  const ids = useWishlistStore((s) => s.ids);
  const { data = [], isLoading, error, refetch } = useProductsByIds(ids);
  const available = data.filter((p) => p.stockStatus !== 'out_of_stock').length;

  return (
    <div className="container-page pb-10 pt-10 sm:pt-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.4rem] leading-tight sm:text-[3rem]">Wishlist</h1>
          {ids.length > 0 && (
            <p className="mt-2 text-[14px] text-taupe">
              {ids.length} saved · {available} available now · saved on this device
            </p>
          )}
        </div>
      </div>
      {!ids.length ? (
        <EmptyState icon={Heart} title="Nothing saved yet" description="Tap the heart on any product to keep it here for later." action={<Button to="/shop">Discover the collection</Button>} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <ProductGrid products={data} loading={isLoading && !data.length} skeletonCount={Math.min(ids.length, 8)} />
      )}
    </div>
  );
}
