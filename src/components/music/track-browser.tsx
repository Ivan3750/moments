"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Pause, Play, Search } from "lucide-react";
import { Equalizer, usePlayer } from "@/components/music/player";
import { cn } from "@/components/ui/cn";
import type { TrackView } from "@/lib/types";

type State = { status: "loading" } | { status: "error" } | { status: "ok"; tracks: TrackView[]; query: string };

/**
 * Search box + results (or the global chart when empty). With `onPick`, rows
 * get a "select" action instead of just previewing — used when attaching music to a post.
 */
export function TrackBrowser({
  onPick,
  pickedId,
  autoFocus,
  className,
}: {
  onPick?: (track: TrackView) => void;
  pickedId?: string | null;
  autoFocus?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const player = usePlayer();

  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetch(q ? `/api/music/search?q=${encodeURIComponent(q)}` : "/api/music/chart", { signal: controller.signal });
          if (!res.ok) throw new Error();
          setState({ status: "ok", tracks: (await res.json()).tracks, query: q });
        } catch (e) {
          if ((e as Error).name !== "AbortError") setState({ status: "error" });
        }
      },
      q ? 350 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, attempt]);

  return (
    <div className={className}>
      <label className="relative block">
        <span className="sr-only">Search music</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setState({ status: "loading" });
          }}
          placeholder="Search songs or artists"
          className="h-10 w-full rounded-xl border border-line bg-subtle pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
      </label>

      <div className="mt-3">
        {state.status === "loading" && (
          <ul className="space-y-2" aria-busy>
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 p-1.5">
                <div className="skeleton size-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {state.status === "error" && (
          <div className="rounded-xl bg-subtle p-6 text-center text-sm">
            <p className="font-medium">Music is unavailable right now.</p>
            <p className="mt-1 text-muted">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => {
                setState({ status: "loading" });
                setAttempt((n) => n + 1);
              }}
              className="mt-3 font-semibold text-accent hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {state.status === "ok" && (
          <>
            <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {state.query ? `Results for “${state.query}”` : "Trending now"}
            </p>
            {state.tracks.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No tracks found.</p>
            ) : (
              <ul>
                {state.tracks.map((t) => {
                  const active = player.current?.id === t.id;
                  const isPlaying = active && player.playing;
                  return (
                    <li key={t.id} className={cn("flex items-center gap-3 rounded-xl p-1.5", active && "bg-subtle")}>
                      <button
                        type="button"
                        onClick={() => player.toggle(t)}
                        aria-label={`${isPlaying ? "Pause" : "Play"} ${t.title}`}
                        className="group relative size-12 shrink-0 overflow-hidden rounded-lg bg-subtle"
                      >
                        {t.cover && <Image src={t.cover} alt="" width={48} height={48} unoptimized className="size-12 object-cover" />}
                        <span className={cn("absolute inset-0 grid place-items-center bg-black/40 text-white transition", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
                          {isPlaying ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5" fill="currentColor" />}
                        </span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold">
                          <span className="truncate">{t.title}</span>
                          {isPlaying && <Equalizer active />}
                        </p>
                        <p className="truncate text-xs text-muted">{t.artist}</p>
                      </div>
                      {onPick && (
                        <button
                          type="button"
                          onClick={() => onPick(t)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-lg px-3 text-sm font-semibold",
                            pickedId === t.id ? "bg-accent text-accent-fg" : "bg-subtle hover:brightness-95",
                          )}
                        >
                          {pickedId === t.id && <Check className="size-4" />}
                          {pickedId === t.id ? "Selected" : "Select"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
