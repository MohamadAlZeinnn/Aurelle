import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { cartService, catalogService, orderService } from '../services/index.js';
import { useCartStore } from '../stores/cartStore.js';
import { useAuthStore } from '../stores/authStore.js';

export const qk = {
  products: (params) => ['products', params],
  product: (slug) => ['product', slug],
  productsByIds: (ids) => ['products-by-ids', ids],
  related: (slug) => ['related', slug],
  reviews: (id) => ['reviews', id],
  categories: ['categories'],
  filters: ['filters'],
  home: ['home'],
  settings: ['store-settings'],
  myOrders: ['my-orders'],
  myOrder: (ref) => ['my-order', ref],
};

export const useProducts = (params, options = {}) => useQuery({ queryKey: qk.products(params), queryFn: () => catalogService.listProducts(params), placeholderData: keepPreviousData, ...options });
export const useProduct = (slug) => useQuery({ queryKey: qk.product(slug), queryFn: () => catalogService.getProduct(slug), enabled: Boolean(slug), retry: (n, e) => e?.status !== 404 && n < 2 });
export const useProductsByIds = (ids) => useQuery({ queryKey: qk.productsByIds(ids), queryFn: () => catalogService.getProductsByIds(ids), placeholderData: keepPreviousData });
export const useRelated = (slug) => useQuery({ queryKey: qk.related(slug), queryFn: () => catalogService.getRelated(slug), enabled: Boolean(slug) });
export const useReviews = (productId) => useQuery({ queryKey: qk.reviews(productId), queryFn: () => catalogService.getReviews(productId), enabled: Boolean(productId) });
export const useCategories = () => useQuery({ queryKey: qk.categories, queryFn: catalogService.getCategories, staleTime: 5 * 60_000 });
export const useFilters = () => useQuery({ queryKey: qk.filters, queryFn: catalogService.getFilters, staleTime: 10 * 60_000 });
export const useHome = () => useQuery({ queryKey: qk.home, queryFn: catalogService.getHome });
export const useStoreSettings = () => useQuery({ queryKey: qk.settings, queryFn: catalogService.getStoreSettings, staleTime: 5 * 60_000 });
export const useMyOrders = () => useQuery({ queryKey: qk.myOrders, queryFn: orderService.myOrders });
export const useMyOrder = (ref) => useQuery({ queryKey: qk.myOrder(ref), queryFn: () => orderService.myOrder(ref), enabled: Boolean(ref) });

/**
 * Server-priced view of the cart. Re-runs whenever lines, coupon or region change, and on
 * window focus — so stock changes made elsewhere are picked up and explained.
 */
export function useCartQuote({ governorate: governorateOverride } = {}) {
  const lines = useCartStore((s) => s.lines);
  const couponCode = useCartStore((s) => s.couponCode);
  const storedGovernorate = useCartStore((s) => s.governorate);
  const syncWithQuote = useCartStore((s) => s.syncWithQuote);
  const userId = useAuthStore((s) => s.user?.id);
  const governorate = governorateOverride ?? storedGovernorate;
  const items = useMemo(() => lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })), [lines]);

  const query = useQuery({
    queryKey: ['cart-quote', items, couponCode, governorate, userId],
    queryFn: () => cartService.quote({ items, couponCode, governorate }),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  useEffect(() => {
    if (query.data && !query.isPlaceholderData) syncWithQuote(query.data);
  }, [query.data, query.isPlaceholderData, syncWithQuote]);

  return { ...query, isEmpty: items.length === 0 };
}
