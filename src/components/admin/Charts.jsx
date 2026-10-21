import { useId, useMemo, useRef, useState } from 'react';
import { formatPrice } from '../../lib/money.js';
import { formatDate } from '../../lib/format.js';

// Single-series charts in one hue (espresso line on a bronze-tinted area), recessive grid,
// crosshair tooltip on hover/focus, and an equivalent data table for screen readers.

const niceMax = (v) => {
  if (v <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
};

export function SalesTrendChart({ series, height = 240 }) {
  const id = useId();
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = height;
  const pad = { l: 48, r: 12, t: 12, b: 28 };
  const max = niceMax(Math.max(...series.map((d) => d.sales), 0));
  const x = (i) => pad.l + (i / Math.max(1, series.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, max / 2, max];

  const { line, area } = useMemo(() => {
    const pts = series.map((d, i) => [x(i), y(d.sales)]);
    const l = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
    return { line: l, area: `${l} L${x(series.length - 1)},${y(0)} L${x(0)},${y(0)} Z` };
  }, [series, max]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };
  const labelEvery = Math.ceil(series.length / 6);
  const h = hover != null ? series[hover] : null;

  return (
    <figure className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-labelledby={`${id}-t`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onPointerDown={onMove}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setHover((v) => Math.min(series.length - 1, (v ?? -1) + 1));
          if (e.key === 'ArrowLeft') setHover((v) => Math.max(0, (v ?? series.length) - 1));
        }}
        onBlur={() => setHover(null)}
      >
        <title id={`${id}-t`}>Daily sales over the last {series.length} days. Use arrow keys to inspect days.</title>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#9A7456" stopOpacity="0.22" />
            <stop offset="1" stopColor="#9A7456" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E6DED6" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6B625D">
              ${t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}
            </text>
          </g>
        ))}
        {series.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#6B625D">
              {formatDate(d.date, { year: undefined })}
            </text>
          ) : null
        )}
        <path d={area} fill={`url(#${id}-g)`} />
        <path d={line} fill="none" stroke="#302823" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} stroke="#8A817C" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h.sales)} r="5" fill="#302823" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )}
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 border border-line bg-porcelain px-3 py-2 text-[12.5px] shadow-soft"
          style={{ left: `${(x(hover) / W) * 100}%` }}
          role="status"
        >
          <p className="text-taupe">{formatDate(h.date)}</p>
          <p className="font-medium tabular-nums">{formatPrice(h.sales)}</p>
          <p className="text-taupe">
            {h.orders} order{h.orders === 1 ? '' : 's'}
          </p>
        </div>
      )}
      <table className="sr-only">
        <caption>Daily sales</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Sales</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {series.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{formatPrice(d.sales)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Horizontal bar list: label + value as text, a thin bar for magnitude. */
export function BarList({ items, valueKey = 'value', format = (v) => v, labelRender }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.key ?? item.label} title={`${item.label}: ${format(item[valueKey])}`}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[13.5px]">
            <span className="min-w-0 truncate">{labelRender ? labelRender(item) : item.label}</span>
            <span className="shrink-0 tabular-nums text-espresso-soft">{format(item[valueKey])}</span>
          </div>
          <div className="h-1.5 w-full bg-linen">
            <div className="h-full rounded-r bg-bronze" style={{ width: `${(item[valueKey] / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
