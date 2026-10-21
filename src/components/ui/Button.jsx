import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/format.js';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  quiet: 'btn-quiet',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  light: 'btn-light',
};
const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

/** Button that renders a <Link> when `to` is set. `loading` keeps width stable and blocks clicks. */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, to, href, className, children, block, type = 'button', ...rest },
  ref
) {
  const classes = cn('btn', VARIANTS[variant], SIZES[size], block && 'w-full', className);
  const content = (
    <>
      {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton({ label, className, children, badge, ...rest }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} title={label} className={cn('icon-btn relative', className)} {...rest}>
      {children}
      {badge ? (
        <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-espresso px-1 text-[10px] font-medium leading-none text-ivory" aria-hidden>
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );
});

export const Spinner = ({ className, label = 'Loading' }) => (
  <span role="status" className={cn('inline-flex items-center gap-2 text-taupe', className)}>
    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
    <span className="sr-only">{label}</span>
  </span>
);
