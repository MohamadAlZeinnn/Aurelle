import { cn } from '../../lib/format.js';

const TONES = {
  neutral: 'bg-linen text-espresso-soft border-line',
  sage: 'bg-sage-soft text-sage border-sage/20',
  amber: 'bg-amber-soft text-amber border-amber/20',
  rosewood: 'bg-rosewood-soft text-rosewood border-rosewood/20',
  slate: 'bg-slate-soft text-slate border-slate/20',
  bronze: 'bg-champagne-soft text-[#6E4F37] border-champagne/40',
  blush: 'bg-blush-soft text-espresso border-blush-deep/40',
  dark: 'bg-espresso text-ivory border-espresso',
  light: 'bg-ivory/95 text-espresso border-transparent',
};

export function Badge({ tone = 'neutral', children, className, dot = false }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-[3px] text-[11px] font-medium uppercase tracking-[0.1em]', TONES[tone] || TONES.neutral, className)}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
