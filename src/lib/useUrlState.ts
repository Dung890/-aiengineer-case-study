'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Query-string state without `useSearchParams`.
 *
 * Ch.04 wants deep links: any view you can reach should be a URL you can send
 * to a colleague. Next's `useSearchParams` suspends on dynamic routes that
 * aren't prerendered, which parks this screen behind a Suspense fallback that
 * never resolves in practice.
 *
 * So we read the query string once on mount and write it back with
 * `history.replaceState`. That keeps the two properties that actually matter —
 * the URL describes the view, and loading that URL restores it — while the
 * heavy split-pane screens stay plain client components. `replaceState` rather
 * than `pushState` is deliberate: selecting a different figure to inspect
 * shouldn't stack up twenty history entries between you and the back button.
 */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const defaultsRef = useRef(defaults);
  const [params, setState] = useState<Record<string, string>>(defaults);

  // Hydrate from the URL after mount, so a shared link opens where it should.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if ([...sp.keys()].length === 0) return;
    const next: Record<string, string> = { ...defaultsRef.current };
    sp.forEach((v, k) => {
      next[k] = v;
    });
    setState(next);
  }, []);

  const setParams = useCallback((patch: Record<string, string | undefined>) => {
    setState((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) delete next[k];
        else next[k] = v;
      }
      if (typeof window !== 'undefined') {
        // Empty values are dropped so a shared link carries only what is
        // actually set — `?q=northwind`, not `?q=northwind&cat=&status=`.
        const sp = new URLSearchParams(
          Object.entries(next).filter(([, v]) => v !== '' && v != null) as [string, string][],
        );
        const qs = sp.toString();
        window.history.replaceState(
          null,
          '',
          qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
        );
      }
      return next;
    });
  }, []);

  // Keys beyond the declared defaults are legitimate — a shared link can carry
  // `?doc=` or `?region=` that the caller only reads conditionally.
  return [params as T & Record<string, string | undefined>, setParams] as const;
}

/** The return id, taken from the path. `usePathname` does not suspend. */
export function useReturnIdFromPath(pathname: string) {
  const m = pathname.match(/\/returns\/([^/]+)/);
  return m?.[1] ?? '';
}
