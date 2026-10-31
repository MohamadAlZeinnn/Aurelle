import { siteConfig } from "@/data/site-config";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const lbp = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatUSD(amount: number): string {
  return usd.format(amount);
}

/** Indicative LBP amount, or null when no rate is configured. Rounded to the nearest 1,000 LBP. */
export function formatLBP(amountUSD: number): string | null {
  const rate = siteConfig.currency.lbpRate;
  if (!rate) return null;
  return `${lbp.format(Math.round((amountUSD * rate) / 1000) * 1000)} LBP`;
}

/** Round to cents to avoid floating point drift when summing. */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
