import { useEffect, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Skeleton, EmptyState, ErrorState } from '../ui/index.js';
import { useDebounce } from '../../hooks/useUtils.js';
import { cn } from '../../lib/format.js';

export function AdminPageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-[1.9rem] leading-tight sm:text-[2.2rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] text-taupe">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className, bodyClassName, description }) {
  return (
    <section className={cn('border border-line bg-porcelain', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            {title && <h2 className="font-sans text-[13px] font-medium uppercase tracking-[0.12em]">{title}</h2>}
            {description && <p className="text-[12.5px] text-taupe">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, change, tone, icon: Icon }) {
  const ChangeIcon = change == null ? null : change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  return (
    <div className="flex flex-col justify-between border border-line bg-porcelain p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-taupe">{label}</p>
        {Icon && <Icon aria-hidden className={cn('h-4 w-4', tone === 'warning' ? 'text-amber' : tone === 'critical' ? 'text-rosewood' : 'text-bronze')} strokeWidth={1.5} />}
      </div>
      <p className="mt-3 font-display text-[2rem] leading-none tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-[12.5px] text-taupe">
        {ChangeIcon && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', change > 0 ? 'text-sage' : change < 0 ? 'text-rosewood' : 'text-taupe')}>
            <ChangeIcon aria-hidden className="h-3.5 w-3.5" />
            {Math.abs(change)}%<span className="sr-only">{change > 0 ? ' increase' : change < 0 ? ' decrease' : ' no change'}</span>
          </span>
        )}
        {hint}
      </div>
    </div>
  );
}

/** Debounced search input for admin lists. */
export function SearchInput({ value, onChange, placeholder = 'Search…', label = 'Search', className }) {
  const [local, setLocal] = useState(value ?? '');
  const debounced = useDebounce(local, 300);
  useEffect(() => {
    if (debounced !== (value ?? '')) onChange(debounced);
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setLocal(value ?? ''), [value]);
  return (
    <div className={cn('relative', className)}>
      <label className="sr-only" htmlFor={`s-${label}`}>
        {label}
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" strokeWidth={1.5} />
      <input id={`s-${label}`} type="search" value={local} onChange={(e) => setLocal(e.target.value)} placeholder={placeholder} className="input !min-h-[40px] pl-9 text-[14px]" />
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, className }) {
  return (
    <label className={cn('block', className)}>
      <span className="sr-only">{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className="input !min-h-[40px] w-full py-0 pr-9 text-[14px]">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toolbar({ children }) {
  return <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

/**
 * Data table with loading/empty/error states. Below `md`, rows render as cards via
 * `renderCard` (or a stacked fallback of the column cells).
 */
export function AdminTable({ columns, rows, rowKey = 'id', loading, error, onRetry, empty, renderCard, onRowClick, caption }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!loading && !rows?.length) return <div className="border border-line bg-porcelain">{empty ?? <EmptyState compact title="Nothing here yet" />}</div>;
  const data = loading ? Array.from({ length: 6 }, (_, i) => ({ [rowKey]: `sk-${i}` })) : rows;
  return (
    <>
      <div className="hidden overflow-x-auto border border-line bg-porcelain md:block">
        <table className="table-base">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn(c.align === 'right' && 'text-right', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row[rowKey]} className={cn(onRowClick && !loading && 'cursor-pointer')} onClick={onRowClick && !loading ? () => onRowClick(row) : undefined}>
                {columns.map((c) => (
                  <td key={c.key} className={cn(c.align === 'right' && 'text-right tabular-nums', c.className)}>
                    {loading ? <Skeleton className="h-4 w-full max-w-[140px]" /> : c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {data.map((row) => (
          <li key={row[rowKey]}>
            {loading ? (
              <Skeleton className="h-28" />
            ) : renderCard ? (
              renderCard(row)
            ) : (
              <div className="border border-line bg-porcelain p-4">
                <dl className="space-y-1.5 text-[13.5px]">
                  {columns
                    .filter((c) => !c.hideOnCard)
                    .map((c) => (
                      <div key={c.key} className="flex items-center justify-between gap-3">
                        <dt className="text-taupe">{c.header}</dt>
                        <dd className="text-right">{c.cell(row)}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export function Thumb({ src, alt = '', size = 40 }) {
  return (
    <span className="block shrink-0 overflow-hidden bg-linen" style={{ width: size, height: size * 1.25 }}>
      {src && <img src={src} alt={alt} width={size} height={size * 1.25} loading="lazy" className="h-full w-full object-cover" />}
    </span>
  );
}
