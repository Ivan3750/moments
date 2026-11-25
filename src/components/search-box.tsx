"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Hash, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { UserLite } from "@/lib/types";

type Results = { users: UserLite[]; tags: { tag: string; count: number }[] };

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<{ q: string; data: Results } | null>(null);
  const [focused, setFocused] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  const q = query.trim();
  // Only show results that belong to what's currently typed; anything else counts as "still loading".
  const results = response && response.q === q ? response.data : null;
  const loading = q.length > 0 && !results;

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) setResponse({ q, data: await res.json() });
      } catch {
        /* aborted or offline */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => !wrapper.current?.contains(e.target as Node) && setFocused(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const showPanel = focused && q.length > 0;
  const empty = results && results.users.length === 0 && results.tags.length === 0;

  return (
    <div ref={wrapper} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="search-results"
          aria-label="Search people and hashtags"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => e.key === "Escape" && (setFocused(false), (e.target as HTMLInputElement).blur())}
          placeholder="Search people and #hashtags"
          className="h-11 w-full rounded-xl bg-subtle pl-10 pr-10 text-[15px] outline-none ring-accent/40 placeholder:text-muted focus:ring-2 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-muted/60 text-bg">
            <X className="size-3" strokeWidth={3} />
          </button>
        )}
      </div>

      {showPanel && (
        <div id="search-results" role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 max-h-[70dvh] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
          {loading && <p className="p-4 text-center text-sm text-muted">Searching…</p>}
          {empty && !loading && <p className="p-4 text-center text-sm text-muted">No results for “{q}”</p>}
          {results?.users.map((u) => (
            <Link key={u.id} role="option" aria-selected={false} href={`/${u.username}`} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-subtle">
              <Avatar user={u} size={44} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{u.username}</p>
                {u.name && <p className="truncate text-sm text-muted">{u.name}</p>}
              </div>
            </Link>
          ))}
          {results?.tags.map((t) => (
            <Link key={t.tag} role="option" aria-selected={false} href={`/tags/${encodeURIComponent(t.tag)}`} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-subtle">
              <span className="grid size-11 place-items-center rounded-full border border-line">
                <Hash className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">#{t.tag}</p>
                <p className="text-sm text-muted">
                  {t.count} {t.count === 1 ? "post" : "posts"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
