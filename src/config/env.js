// Central place for build-time configuration. Everything here is public (bundled),
// so it must never contain secrets.
const env = import.meta.env ?? {};

export const API_MODE = env.VITE_API_MODE === 'live' ? 'live' : 'demo';
export const IS_DEMO = API_MODE === 'demo';
export const API_BASE_URL = env.VITE_API_BASE_URL || '/api/v1';
export const DEMO_LATENCY_MS = Number(env.VITE_DEMO_LATENCY_MS ?? 350);

export const BRAND = {
  name: env.VITE_BRAND_NAME || 'LUMA Beauty',
  shortName: env.VITE_BRAND_SHORT_NAME || 'LUMA',
  supportEmail: env.VITE_SUPPORT_EMAIL || 'care@lumabeauty.example',
  whatsappNumber: env.VITE_WHATSAPP_NUMBER ?? '96170000000',
  instagramUrl: env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/',
  locale: 'en',
  dir: 'ltr',
  currency: 'USD',
};

export const whatsappLink = (message = '') =>
  BRAND.whatsappNumber
    ? `https://wa.me/${BRAND.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`
    : null;
