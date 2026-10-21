import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useFocusTrap, useScrollLock } from '../../hooks/useUtils.js';
import { cn } from '../../lib/format.js';

function Overlay({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-espresso/40 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      aria-hidden
    />
  );
}

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

function DialogShell({ open, onClose, children, title, description, render }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();
  useScrollLock(open);
  useFocusTrap(ref, open);
  useEscape(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <Overlay onClose={onClose} />
          {render({ ref, titleId, descId, title, description, children })}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Centered dialog. On small screens it becomes a bottom sheet. */
export function Modal({ open, onClose, title, description, children, size = 'md', className, hideHeader = false, footer }) {
  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      render={({ ref, titleId, descId }) => (
        <div className="pointer-events-none fixed inset-0 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            className={cn('pointer-events-auto relative flex max-h-[92vh] w-full flex-col bg-ivory shadow-lift sm:max-h-[88vh]', widths[size], className)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {!hideHeader && (
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
                <div>
                  {title && (
                    <h2 id={titleId} className="font-display text-[1.45rem] leading-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="mt-1 text-[13.5px] text-taupe">
                      {description}
                    </p>
                  )}
                </div>
                <button type="button" onClick={onClose} className="icon-btn -mr-2 -mt-1 shrink-0" aria-label="Close">
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            )}
            {hideHeader && (
              <button type="button" onClick={onClose} className="icon-btn absolute right-3 top-3 z-10 bg-ivory/80" aria-label="Close">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer && <div className="border-t border-line px-5 py-4 sm:px-7">{footer}</div>}
          </motion.div>
        </div>
      )}
    />
  );
}

/** Side panel (cart, filters, mobile navigation). */
export function Drawer({ open, onClose, title, children, footer, side = 'right', widthClass = 'max-w-[440px]', headerExtra }) {
  const from = side === 'right' ? '100%' : '-100%';
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      render={({ ref, titleId }) => (
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn('fixed inset-y-0 flex w-full flex-col bg-ivory shadow-lift', widthClass, side === 'right' ? 'right-0' : 'left-0')}
          initial={{ x: from }}
          animate={{ x: 0 }}
          exit={{ x: from }}
          transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 id={titleId} className="font-display text-[1.35rem] leading-none">
              {title}
            </h2>
            <div className="flex items-center gap-1">
              {headerExtra}
              <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Close">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="border-t border-line bg-porcelain px-5 py-4">{footer}</div>}
        </motion.div>
      )}
    />
  );
}
