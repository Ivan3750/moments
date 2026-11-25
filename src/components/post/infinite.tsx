"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/button";
import type { Page } from "@/lib/types";

/** Cursor-paginated list: appends pages as the sentinel scrolls into view. */
export function useInfinite<T extends { id: string }>(endpoint: string, initial: Page<T>) {
  const [items, setItems] = useState<T[]>(initial.items);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);

  // After router.refresh() (new post, deleted post…) the server hands us a fresh first page: start over from it.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setItems(initial.items);
    setCursor(initial.nextCursor);
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || !cursor) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      const sep = endpoint.includes("?") ? "&" : "?";
      const res = await fetch(`${endpoint}${sep}cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) throw new Error();
      const page = (await res.json()) as Page<T>;
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [endpoint, cursor]);

  return { items, setItems, hasMore: !!cursor, loading, error, loadMore };
}

export function Sentinel({ onVisible, loading, error, hasMore, rootMargin = "600px" }: { onVisible: () => void; loading: boolean; error: boolean; hasMore: boolean; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onVisible);
  useEffect(() => {
    cb.current = onVisible;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || error) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && cb.current(), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, error, rootMargin, loading]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className="flex h-16 items-center justify-center text-muted" aria-live="polite">
      {error ? (
        <button type="button" onClick={onVisible} className="text-sm font-semibold text-accent hover:underline">
          Couldn&apos;t load more — retry
        </button>
      ) : (
        loading && <Spinner className="size-5" />
      )}
    </div>
  );
}
