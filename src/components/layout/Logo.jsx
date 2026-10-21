import { Link } from 'react-router-dom';
import { BRAND } from '../../config/env.js';
import { cn } from '../../lib/format.js';

export function Logo({ className, light = false, to = '/' }) {
  return (
    <Link to={to} className={cn('inline-flex flex-col items-center leading-none', light ? 'text-ivory' : 'text-espresso', className)} aria-label={`${BRAND.name} — home`}>
      <span className="font-display text-[26px] tracking-[0.34em] sm:text-[28px]" style={{ marginRight: '-0.34em' }}>
        {BRAND.shortName}
      </span>
      <span className={cn('mt-1 text-[8.5px] font-medium uppercase tracking-[0.5em]', light ? 'text-ivory/70' : 'text-taupe')} style={{ marginRight: '-0.5em' }}>
        Beauty · Beirut
      </span>
    </Link>
  );
}
