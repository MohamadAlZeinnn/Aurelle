import { useId } from "react";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}

/** Label + control + hint/error wiring with correct ARIA attributes. */
export function Field({ label, error, hint, optional, className = "", children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[0.7rem] font-medium tracking-[0.16em] text-stone uppercase">
        {label}
        {optional && <span className="ml-2 tracking-normal normal-case text-stone/80">(optional)</span>}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-xs text-stone">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
