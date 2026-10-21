import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../stores/uiStores.js';
import { cn } from '../../lib/format.js';
import { Button } from './Button.jsx';

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:left-auto sm:right-0 sm:items-end sm:p-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-[380px] items-start gap-3 border border-line bg-porcelain px-4 py-3.5 shadow-lift"
          >
            {t.image ? (
              <img src={t.image} alt="" width="44" height="55" className="h-[55px] w-[44px] shrink-0 bg-linen object-cover" />
            ) : t.tone === 'error' ? (
              <AlertTriangle aria-hidden className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rosewood" strokeWidth={1.6} />
            ) : (
              <CheckCircle2 aria-hidden className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sage" strokeWidth={1.6} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium leading-snug">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] leading-snug text-taupe">{t.description}</p>}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.14em] underline underline-offset-4"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="-mr-1 -mt-0.5 p-1 text-taupe hover:text-espresso" aria-label="Dismiss notification">
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact = false }) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center text-center', compact ? 'py-10' : 'py-16 sm:py-24', className)}>
      {Icon && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-porcelain text-bronze">
          <Icon aria-hidden className="h-6 w-6" strokeWidth={1.3} />
        </span>
      )}
      <h2 className="font-display text-[1.6rem] leading-tight">{title}</h2>
      {description && <p className="mt-2 text-[14.5px] leading-relaxed text-taupe">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We could not load this right now', className }) {
  return (
    <div role="alert" className={cn('mx-auto flex max-w-md flex-col items-center py-14 text-center', className)}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rosewood-soft text-rosewood">
        <AlertTriangle aria-hidden className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <h2 className="font-display text-[1.4rem]">{title}</h2>
      <p className="mt-2 text-[14px] text-taupe">{error?.message || 'Please check your connection and try again.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

const NOTICE_TONES = {
  info: ['border-slate/20 bg-slate-soft text-slate', Info],
  warning: ['border-amber/25 bg-amber-soft text-[#6B4510]', AlertTriangle],
  error: ['border-rosewood/25 bg-rosewood-soft text-rosewood', AlertTriangle],
  success: ['border-sage/25 bg-sage-soft text-sage', CheckCircle2],
};

export function Notice({ tone = 'info', title, children, className, onDismiss, action }) {
  const [classes, Icon] = NOTICE_TONES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 border px-4 py-3 text-[13.5px] leading-relaxed', classes, className)}>
      <Icon aria-hidden className="mt-[3px] h-4 w-4 shrink-0" strokeWidth={1.7} />
      <div className="min-w-0 flex-1 text-espresso">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-espresso-soft')}>{children}</div>}
        {action}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="-mr-1 p-0.5 text-espresso-soft hover:text-espresso" aria-label="Dismiss">
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

export function TextLink({ to, children, className }) {
  return (
    <Link to={to} className={cn('link-underline', className)}>
      {children}
    </Link>
  );
}
