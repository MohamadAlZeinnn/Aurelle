"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label: string;
  size?: "sm" | "md";
}

export function QuantitySelector({ value, onChange, min = 1, max, label, size = "md" }: Props) {
  const h = size === "sm" ? "h-9" : "h-[3.25rem]";
  const w = size === "sm" ? "w-9" : "w-12";
  return (
    <div className={`inline-flex items-center border border-ink/20 ${h}`} role="group" aria-label={label}>
      <button
        type="button"
        className={`flex ${h} ${w} items-center justify-center transition-colors hover:bg-linen disabled:opacity-30`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" strokeWidth={1.5} />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-sm tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={`flex ${h} ${w} items-center justify-center transition-colors hover:bg-linen disabled:opacity-30`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" strokeWidth={1.5} />
      </button>
    </div>
  );
}
