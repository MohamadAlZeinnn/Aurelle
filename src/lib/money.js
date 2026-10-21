const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export const formatPrice = (amount) => formatter.format(Number(amount) || 0);

// Work in cents to avoid floating point drift when summing.
export const toCents = (amount) => Math.round(Number(amount || 0) * 100);
export const fromCents = (cents) => Math.round(cents) / 100;
export const roundMoney = (amount) => fromCents(toCents(amount));
