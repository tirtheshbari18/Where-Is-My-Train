import { useCallback, useMemo, useRef } from 'react';

/**
 * Guards against out-of-order async responses overwriting newer state.
 *
 * Usage:
 *   const guard = useRequestGuard();
 *   const id = guard.next();          // start a new request; invalidates all older ones
 *   const data = await fetchSomething();
 *   if (!guard.isCurrent(id)) return; // a newer request started -> drop this response
 *
 * Applying this consistently means only the latest active request may update the UI,
 * so stale loading flags, stale errors and stale results are all prevented.
 */
export interface RequestGuard {
  /** Marks the start of a new request and returns its id. Older ids become stale. */
  next(): number;
  /** True only if no newer request has started since `id` was issued. */
  isCurrent(id: number): boolean;
  /** Invalidates every in-flight request (used on unmount). */
  invalidate(): void;
}

export function useRequestGuard(): RequestGuard {
  const counterRef = useRef(0);

  const next = useCallback(() => {
    counterRef.current += 1;
    return counterRef.current;
  }, []);

  const isCurrent = useCallback((id: number) => counterRef.current === id, []);

  const invalidate = useCallback(() => {
    counterRef.current += 1;
  }, []);

  return useMemo(() => ({ next, isCurrent, invalidate }), [next, isCurrent, invalidate]);
}

export default useRequestGuard;
