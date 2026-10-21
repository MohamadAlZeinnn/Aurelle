import { cloneElement, forwardRef, isValidElement, useId } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '../../lib/format.js';

/**
 * Accessible form field: wires label, hint and error to the control via ids.
 * Usage: <Field label="Email" error={errors.email?.message}><Input {...register('email')} /></Field>
 */
export function Field({ label, hint, error, optional, children, className, labelHidden = false, id: idProp }) {
  const autoId = useId();
  const id = idProp || `f${autoId.replace(/:/g, '')}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
      })
    : children;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={cn('field-label', labelHidden && 'sr-only')}>
          {label}
          {optional && <span className="ml-1 font-normal text-taupe">(optional)</span>}
        </label>
      )}
      {control}
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          <AlertCircle aria-hidden className="mt-[2px] h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn('input', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn('input', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, placeholder, ...props }, ref) {
  return (
    <select ref={ref} className={cn('input', className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
});

export const Checkbox = forwardRef(function Checkbox({ label, description, className, error, ...props }, ref) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="group flex cursor-pointer items-start gap-3">
        <span className="relative mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-sm border border-line-strong bg-porcelain transition-colors checked:border-espresso checked:bg-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze group-hover:border-taupe"
            aria-invalid={error ? 'true' : undefined}
            {...props}
          />
          <Check aria-hidden className="pointer-events-none absolute h-3 w-3 text-ivory opacity-0 peer-checked:opacity-100" strokeWidth={2.5} />
        </span>
        <span className="text-[14px] leading-snug">
          {label}
          {description && <span className="mt-0.5 block text-[12.5px] text-taupe">{description}</span>}
        </span>
      </label>
      {error && <p className="field-error ml-8">{error}</p>}
    </div>
  );
});

/** Large selectable option, used for payment methods and shipping choices. */
export const RadioCard = forwardRef(function RadioCard({ label, description, aside, className, ...props }, ref) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3.5 border border-line bg-porcelain p-4 transition-colors hover:border-taupe-light has-[:checked]:border-espresso has-[:checked]:bg-ivory has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bronze',
        className
      )}
    >
      <input ref={ref} id={id} type="radio" className="peer sr-only" {...props} />
      <span aria-hidden className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-line-strong peer-checked:border-espresso peer-checked:[&>span]:scale-100">
        <span className="h-2.5 w-2.5 scale-0 rounded-full bg-espresso transition-transform" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3 text-[14.5px] font-medium">
          {label}
          {aside}
        </span>
        {description && <span className="mt-1 block text-[13px] leading-relaxed text-taupe">{description}</span>}
      </span>
    </label>
  );
});
