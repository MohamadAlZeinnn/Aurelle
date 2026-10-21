import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, SearchX } from 'lucide-react';
import { ProductGrid } from '../../components/product/ProductCard.jsx';
import { Button, Checkbox, Drawer, EmptyState, ErrorState, Input, Pagination, Select } from '../../components/ui/index.js';
import { useCategories, useFilters, useProducts } from '../../hooks/queries.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { SORT_OPTIONS, PAGE_SIZE } from '../../constants/catalog.js';
import { cn } from '../../lib/format.js';
import NotFoundPage from './NotFoundPage.jsx';

const LIST_KEYS = ['subcategory', 'brand', 'concern', 'attribute'];
const FLAG_KEYS = [
  ['inStock', 'In stock only'],
  ['onSale', 'On sale'],
  ['isNew', 'New arrivals'],
  ['bestseller', 'Bestsellers'],
];

function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => {
    const p = Object.fromEntries(searchParams);
    LIST_KEYS.forEach((k) => (p[k] = searchParams.get(k)?.split(',').filter(Boolean) ?? []));
    return p;
  }, [searchParams]);

  const update = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([k, v]) => {
      const value = Array.isArray(v) ? v.join(',') : v;
      if (value === undefined || value === null || value === '' || value === false) next.delete(k);
      else next.set(k, String(value));
    });
    if (resetPage) next.delete('page');
    setSearchParams(next, { replace: false });
  };
  const toggleIn = (key, value) => {
    const list = params[key] ?? [];
    update({ [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] });
  };
  return { params, update, toggleIn, clear: () => setSearchParams(params.q ? { q: params.q } : {}) };
}

function FilterGroup({ title, children }) {
  return (
    <fieldset className="border-b border-line py-5 first:pt-0">
      <legend className="float-left mb-3 w-full text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">{title}</legend>
      <div className="clear-both space-y-2.5">{children}</div>
    </fieldset>
  );
}

function PriceFilter({ params, update, bounds }) {
  const [min, setMin] = useState(params.minPrice ?? '');
  const [max, setMax] = useState(params.maxPrice ?? '');
  useEffect(() => {
    setMin(params.minPrice ?? '');
    setMax(params.maxPrice ?? '');
  }, [params.minPrice, params.maxPrice]);
  const invalid = min !== '' && max !== '' && Number(min) > Number(max);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) update({ minPrice: min, maxPrice: max });
      }}
      noValidate
    >
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="min-price">
          Minimum price
        </label>
        <Input id="min-price" type="number" inputMode="decimal" min="0" placeholder={`$${bounds?.min ?? 0}`} value={min} onChange={(e) => setMin(e.target.value)} className="!min-h-[40px]" />
        <span className="text-taupe">–</span>
        <label className="sr-only" htmlFor="max-price">
          Maximum price
        </label>
        <Input id="max-price" type="number" inputMode="decimal" min="0" placeholder={`$${bounds?.max ?? ''}`} value={max} onChange={(e) => setMax(e.target.value)} className="!min-h-[40px]" />
      </div>
      {invalid && <p className="field-error">Minimum must be lower than maximum.</p>}
      <Button type="submit" variant="quiet" size="sm" className="mt-3 w-full" disabled={invalid}>
        Apply price
      </Button>
    </form>
  );
}

function FiltersPanel({ params, update, toggleIn, facets, bounds, category }) {
  const { data: filters } = useFilters();
  const { data: categories = [] } = useCategories();
  const count = (facet, key) => facets?.[facet]?.[key] ?? 0;
  return (
    <div>
      {!category ? (
        <FilterGroup title="Category">
          {categories.map((c) => (
            <Link key={c.id} to={`/shop/${c.slug}${params.q ? `?q=${encodeURIComponent(params.q)}` : ''}`} className="flex justify-between text-[14px] hover:text-bronze">
              {c.name}
              <span className="text-[12px] text-taupe">{count('category', c.slug)}</span>
            </Link>
          ))}
        </FilterGroup>
      ) : (
        category.subcategories.length > 0 && (
          <FilterGroup title="Type">
            {category.subcategories.map((s) => (
              <Checkbox key={s.id} label={`${s.name} (${count('subcategory', s.slug)})`} checked={params.subcategory.includes(s.slug)} onChange={() => toggleIn('subcategory', s.slug)} />
            ))}
          </FilterGroup>
        )
      )}
      <FilterGroup title="Availability">
        {FLAG_KEYS.map(([key, label]) => (
          <Checkbox key={key} label={label} checked={params[key] === 'true'} onChange={(e) => update({ [key]: e.target.checked ? 'true' : null })} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price (USD)">
        <PriceFilter params={params} update={update} bounds={bounds} />
      </FilterGroup>
      <FilterGroup title="Skin concern">
        {filters?.concerns.map((c) => (
          <Checkbox key={c.id} label={`${c.name} (${count('concern', c.id)})`} checked={params.concern.includes(c.id)} onChange={() => toggleIn('concern', c.id)} disabled={!count('concern', c.id) && !params.concern.includes(c.id)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Brand">
        {filters?.brands.map((b) => (
          <Checkbox key={b.id} label={`${b.name} (${count('brand', b.slug)})`} checked={params.brand.includes(b.slug)} onChange={() => toggleIn('brand', b.slug)} disabled={!count('brand', b.slug) && !params.brand.includes(b.slug)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Formula & features">
        {filters?.attributes.map((a) => (
          <Checkbox key={a.id} label={`${a.name} (${count('attribute', a.id)})`} checked={params.attribute.includes(a.id)} onChange={() => toggleIn('attribute', a.id)} disabled={!count('attribute', a.id) && !params.attribute.includes(a.id)} />
        ))}
      </FilterGroup>
    </div>
  );
}

function ActiveChips({ params, update, toggleIn, clear, category }) {
  const { data: filters } = useFilters();
  const chips = [];
  params.subcategory.forEach((s) => chips.push([category?.subcategories.find((x) => x.slug === s)?.name ?? s, () => toggleIn('subcategory', s)]));
  params.brand.forEach((s) => chips.push([filters?.brands.find((b) => b.slug === s)?.name ?? s, () => toggleIn('brand', s)]));
  params.concern.forEach((s) => chips.push([filters?.concerns.find((b) => b.id === s)?.name ?? s, () => toggleIn('concern', s)]));
  params.attribute.forEach((s) => chips.push([filters?.attributes.find((b) => b.id === s)?.name ?? s, () => toggleIn('attribute', s)]));
  FLAG_KEYS.forEach(([k, label]) => params[k] === 'true' && chips.push([label, () => update({ [k]: null })]));
  if (params.minPrice || params.maxPrice) chips.push([`$${params.minPrice || 0} – ${params.maxPrice ? `$${params.maxPrice}` : 'any'}`, () => update({ minPrice: null, maxPrice: null })]);
  if (!chips.length) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map(([label, remove]) => (
        <button key={label} type="button" onClick={remove} className="inline-flex items-center gap-1.5 border border-line-strong bg-porcelain px-3 py-1.5 text-[12.5px] transition-colors hover:border-espresso" aria-label={`Remove filter: ${label}`}>
          {label} <X aria-hidden className="h-3 w-3" />
        </button>
      ))}
      <button type="button" onClick={clear} className="ml-1 text-[12px] font-medium uppercase tracking-[0.12em] link-underline">
        Clear all
      </button>
    </div>
  );
}

export default function ShopPage() {
  const { categorySlug } = useParams();
  const { data: categories, isLoading: catLoading } = useCategories();
  const category = categorySlug ? categories?.find((c) => c.slug === categorySlug) : null;
  const { params, update, toggleIn, clear } = useCatalogParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const page = Number(params.page) || 1;
  const sort = params.sort || 'featured';

  const queryParams = {
    q: params.q,
    category: categorySlug,
    subcategory: params.subcategory.join(','),
    brand: params.brand.join(','),
    concern: params.concern.join(','),
    attribute: params.attribute.join(','),
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    inStock: params.inStock,
    onSale: params.onSale,
    isNew: params.isNew,
    bestseller: params.bestseller,
    sort,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data, isLoading, isFetching, error, refetch } = useProducts(queryParams);

  const title = params.q ? `Results for “${params.q}”` : category ? category.name : params.onSale ? 'Offers' : params.isNew ? 'New arrivals' : params.bestseller ? 'Bestsellers' : 'Shop all';
  usePageMeta({
    title: category?.name ?? (params.q ? `Search: ${params.q}` : 'Shop all'),
    description: category?.tagline ?? 'Shop skincare, eye care, lip care and beauty tools. Cash on delivery across Lebanon.',
    noindex: Boolean(params.q),
  });

  if (categorySlug && !catLoading && !category) return <NotFoundPage />;

  const activeCount = LIST_KEYS.reduce((s, k) => s + params[k].length, 0) + FLAG_KEYS.filter(([k]) => params[k] === 'true').length + (params.minPrice || params.maxPrice ? 1 : 0);
  const panel = <FiltersPanel params={params} update={update} toggleIn={toggleIn} facets={data?.facets} bounds={data?.priceBounds} category={category} />;

  const goToPage = (p) => {
    update({ page: p }, { resetPage: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-page pb-10 pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb" className="mb-5 text-[12.5px] text-taupe">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-espresso">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>{category ? <Link to="/shop" className="hover:text-espresso">Shop</Link> : <span aria-current="page">Shop</span>}</li>
          {category && (
            <>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-espresso">
                {category.name}
              </li>
            </>
          )}
        </ol>
      </nav>
      <header className="mb-8 max-w-2xl sm:mb-10">
        <h1 className="font-display text-[2.4rem] leading-[1.05] sm:text-[3.25rem]">{title}</h1>
        {category?.tagline && <p className="mt-3 text-[15px] text-espresso-soft">{category.tagline}</p>}
      </header>

      {category?.subcategories?.length > 0 && (
        <div className="scrollbar-none -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" onClick={() => update({ subcategory: null })} className={cn('shrink-0 border px-4 py-2 text-[13px] transition-colors', !params.subcategory.length ? 'border-espresso bg-espresso text-ivory' : 'border-line-strong hover:border-espresso')}>
            All
          </button>
          {category.subcategories.map((s) => {
            const active = params.subcategory.length === 1 && params.subcategory[0] === s.slug;
            return (
              <button key={s.id} type="button" onClick={() => update({ subcategory: active ? null : s.slug })} aria-pressed={active} className={cn('shrink-0 border px-4 py-2 text-[13px] transition-colors', active ? 'border-espresso bg-espresso text-ivory' : 'border-line-strong hover:border-espresso')}>
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-[150px] max-h-[calc(100vh-170px)] overflow-y-auto pb-8 pr-2 [scrollbar-width:thin]">{panel}</div>
        </aside>

        <section aria-label="Products" aria-busy={isFetching}>
          <div className="sticky top-[100px] z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-y border-line bg-ivory/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-x-0 lg:border-t-0 lg:bg-transparent lg:px-0 lg:pb-4 lg:pt-0 lg:backdrop-blur-0">
            <button type="button" onClick={() => setFiltersOpen(true)} className="btn btn-sm btn-quiet lg:hidden">
              <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" /> Filters{activeCount ? ` (${activeCount})` : ''}
            </button>
            <p className="hidden text-[13px] text-taupe lg:block" aria-live="polite">
              {data ? `${data.total} ${data.total === 1 ? 'product' : 'products'}` : ' '}
            </p>
            <label className="flex items-center gap-2 text-[13px]">
              <span className="hidden text-taupe sm:inline">Sort by</span>
              <span className="sr-only sm:hidden">Sort by</span>
              <Select value={sort} onChange={(e) => update({ sort: e.target.value === 'featured' ? null : e.target.value })} className="!min-h-[38px] w-auto py-0 pr-9 text-[13px]">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <ActiveChips params={params} update={update} toggleIn={toggleIn} clear={clear} category={category} />

          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !isLoading && data?.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={params.q ? 'Nothing matched your search' : 'No products match these filters'}
              description={params.q ? 'Try a broader term, a product type like “serum”, or browse a category.' : 'Try removing a filter or two to see more of the collection.'}
              action={
                <Button variant="secondary" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className={cn('transition-opacity duration-300', isFetching && !isLoading && 'opacity-60')}>
              <ProductGrid products={data?.items ?? []} loading={isLoading} eagerCount={4} className="lg:grid-cols-3" />
              {data && <p className="mt-10 text-center text-[12.5px] text-taupe lg:hidden">{data.total} products</p>}
              {data && <Pagination className="mt-8" page={data.page} pages={data.pages} onChange={goToPage} />}
            </div>
          )}
        </section>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        side="left"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="quiet" onClick={clear} disabled={!activeCount}>
              Clear all
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>{data ? `Show ${data.total}` : 'Show results'}</Button>
          </div>
        }
      >
        <div className="px-5 py-5">{panel}</div>
      </Drawer>
    </div>
  );
}
