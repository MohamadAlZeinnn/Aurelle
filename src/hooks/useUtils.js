import { useEffect, useRef, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Locks page scroll while `active` (used by modals and drawers). Supports nesting. */
let lockCount = 0;
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    lockCount += 1;
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    if (lockCount === 1) {
      body.style.overflow = 'hidden';
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    }
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        body.style.overflow = '';
        body.style.paddingRight = '';
      }
    };
  }, [active]);
}

/** Traps focus inside `ref` while active and restores it afterwards. */
export function useFocusTrap(ref, active) {
  const previous = useRef(null);
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    previous.current = document.activeElement;
    const node = ref.current;
    const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = () => [...node.querySelectorAll(selector)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    const first = node.querySelector('[data-autofocus]') || focusables()[0] || node;
    requestAnimationFrame(() => first?.focus({ preventScroll: true }));
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const [a, b] = [list[0], list[list.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        b.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a.focus();
      }
    };
    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      if (previous.current && typeof previous.current.focus === 'function') previous.current.focus({ preventScroll: true });
    };
  }, [active, ref]);
}
