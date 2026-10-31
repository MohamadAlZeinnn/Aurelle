import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import { formatLBP, formatUSD } from "@/lib/currency";
import { PENDING_ANSWER } from "@/data/faq";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
      <Tag className="text-headline">{title}</Tag>
      {intro && <p className="mt-5 text-base leading-relaxed text-stone md:text-lg">{intro}</p>}
    </div>
  );
}

/** Price in USD with optional indicative LBP and a visible marker when the amount is a placeholder. */
export function Price({
  amount,
  isPlaceholder = false,
  className = "",
  showLbp = true,
}: {
  amount: number;
  isPlaceholder?: boolean;
  className?: string;
  showLbp?: boolean;
}) {
  const lbp = showLbp ? formatLBP(amount) : null;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span>{formatUSD(amount)}</span>
      {lbp && <span className="text-[0.8em] text-stone">≈ {lbp}</span>}
      {isPlaceholder && <PlaceholderTag />}
    </span>
  );
}

export function PlaceholderTag({ label = "Placeholder" }: { label?: string }) {
  return (
    <span
      title="Placeholder value — confirm before launch"
      className="self-center border border-dashed border-clay/60 px-1.5 py-px font-sans text-[9px] font-medium uppercase tracking-[0.16em] text-clay"
    >
      {label}
    </span>
  );
}

/** Rendered wherever manufacturer-confirmed information has not been supplied yet. */
export function Pending({ children = PENDING_ANSWER }: { children?: React.ReactNode }) {
  return (
    <p className="italic text-stone">
      {children}{" "}
      <Link href="/contact" className="not-italic underline underline-offset-4 hover:text-ink">
        Contact us
      </Link>
    </p>
  );
}

export function freeDeliveryLabel(): string | null {
  const t = siteConfig.shipping.freeDeliveryThreshold;
  return t ? formatUSD(t.amount).replace(".00", "") : null;
}
