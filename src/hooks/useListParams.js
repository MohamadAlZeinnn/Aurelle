import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/** URL-backed list state (search, filters, page) so admin views are shareable and survive refresh. */
export function useListParams(defaults = {}) {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => ({ ...defaults, ...Object.fromEntries(sp) }), [sp]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(sp);
    Object.entries(changes).forEach(([k, v]) => (v === null || v === undefined || v === '' ? next.delete(k) : next.set(k, String(v))));
    if (resetPage && !('page' in changes)) next.delete('page');
    setSp(next, { replace: true });
  };
  return [params, set];
}
