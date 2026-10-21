import { useEffect } from 'react';
import { BRAND } from '../config/env.js';

const setMeta = (attr, key, content) => {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

/**
 * Sets title, description, Open Graph tags, canonical URL and optional JSON-LD.
 * For full SEO in production, pre-render these (SSR/SSG) — see README.
 */
export function usePageMeta({ title, description, image, jsonLd, noindex = false } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BRAND.name}` : `${BRAND.name} — Skincare, eye care & beauty tools in Lebanon`;
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    if (image) setMeta('property', 'og:image', new URL(image, window.location.origin).href);
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + window.location.pathname;

    let script;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.page = 'true';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, image, noindex, jsonLd ? JSON.stringify(jsonLd) : '']); // eslint-disable-line react-hooks/exhaustive-deps
}
