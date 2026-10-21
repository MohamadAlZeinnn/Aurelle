import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore.js';
import { toast, useUiStore, useWishlistStore } from '../stores/uiStores.js';
import { isVariantPurchasable } from '../lib/inventory.js';

/** Adds a product variant to the bag with stock-aware feedback. */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUiStore((s) => s.openCart);
  const navigate = useNavigate();

  return useCallback(
    (product, variant, quantity = 1, { buyNow = false } = {}) => {
      if (!isVariantPurchasable(variant)) {
        toast.error('This option is sold out', { description: 'Use “Notify me” and we will email you when it is back.' });
        return false;
      }
      const res = addItem({ productId: product.id, variantId: variant.id, quantity, available: variant.stock });
      if (!res.ok) {
        if (buyNow && res.reason === 'max') {
          navigate('/checkout');
          return true;
        }
        toast.error(res.reason === 'max' ? 'You already have all available stock in your bag' : 'This option is unavailable', {
          description: res.reason === 'max' ? `We currently have ${Math.min(variant.stock, 10)} available.` : undefined,
        });
        return false;
      }
      if (buyNow) {
        navigate('/checkout');
        return true;
      }
      const label = variant.name !== 'Default' ? ` — ${variant.name}` : '';
      toast.show('Added to your bag', {
        description: `${product.name}${label}${res.clamped ? ` · quantity limited to ${res.quantity} (available stock)` : ''}`,
        image: variant.image || product.images?.[0],
        action: { label: 'View bag', onClick: openCart },
      });
      return true;
    },
    [addItem, openCart, navigate]
  );
}

export function useWishlistToggle() {
  const toggle = useWishlistStore((s) => s.toggle);
  return useCallback(
    (product) => {
      const added = toggle(product.id);
      toast.show(added ? 'Saved to your wishlist' : 'Removed from your wishlist', { description: product.name, duration: 2800 });
    },
    [toggle]
  );
}
