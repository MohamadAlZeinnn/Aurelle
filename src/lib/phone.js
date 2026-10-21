import { LEBANESE_MOBILE_PREFIXES } from '../constants/lebanon.js';

// Accepts "03 123 456", "70-123456", "+961 71 123 456", "00961 3123456" …
// Returns the canonical "+961XXXXXXX(X)" or null when invalid.
export function normalizeLebanesePhone(input) {
  if (!input) return null;
  let digits = String(input).replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('961')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  const prefix = LEBANESE_MOBILE_PREFIXES.find((p) => digits.startsWith(p));
  if (!prefix) return null;
  const expectedLength = prefix === '3' ? 7 : 8;
  if (digits.length !== expectedLength) return null;
  return `+961${digits}`;
}

export const isValidLebanesePhone = (input) => normalizeLebanesePhone(input) !== null;

// "+96170123456" → "+961 70 123 456"
export function formatLebanesePhone(value) {
  const n = normalizeLebanesePhone(value);
  if (!n) return value || '';
  const local = n.slice(4);
  const head = local.startsWith('3') ? local.slice(0, 1) : local.slice(0, 2);
  const rest = local.slice(head.length);
  return `+961 ${head.padStart(2, '0')} ${rest.slice(0, 3)} ${rest.slice(3)}`;
}
