import { useSyncExternalStore } from 'react';

/** Falls back to `fallback` where matchMedia is missing (jsdom, very old browsers). */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
      }
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => (typeof window === 'undefined' || !window.matchMedia ? fallback : window.matchMedia(query).matches),
    () => fallback,
  );
}
