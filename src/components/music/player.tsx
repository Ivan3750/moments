"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play, X } from "lucide-react";
import { toast } from "sonner";

export type PlayableTrack = { id: string; title: string; artist: string; cover: string; preview?: string };

type PlayerCtx = {
  current: PlayableTrack | null;
  playing: boolean;
  loading: boolean;
  toggle: (track: PlayableTrack) => void;
  stop: () => void;
};

const Ctx = createContext<PlayerCtx>({ current: null, playing: false, loading: false, toggle: () => {}, stop: () => {} });
export const usePlayer = () => useContext(Ctx);

/** One shared <audio> element so music keeps playing while you navigate. */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<PlayableTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const requestId = useRef(0);

  const stop = useCallback(() => {
    requestId.current++;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrent(null);
    setPlaying(false);
    setLoading(false);
    setProgress(0);
  }, []);

  const toggle = useCallback(
    async (track: PlayableTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (current?.id === track.id) {
        if (audio.paused) void audio.play().catch(() => undefined);
        else audio.pause();
        return;
      }

      const id = ++requestId.current;
      setCurrent(track);
      setPlaying(false);
      setProgress(0);
      setLoading(true);
      try {
        let src = track.preview;
        if (!src) {
          // Preview links are signed and expire, so fetch a fresh one on demand.
          const res = await fetch(`/api/music/track/${track.id}`);
          if (!res.ok) throw new Error("unavailable");
          src = (await res.json()).track.preview as string;
        }
        if (id !== requestId.current) return; // user picked something else meanwhile
        audio.src = src;
        await audio.play();
      } catch {
        if (id === requestId.current) {
          toast.error("Couldn't play this track right now");
          setCurrent(null);
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [current],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
    const onTime = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTime);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTime);
    };
  }, []);

  const value = useMemo(() => ({ current, playing, loading, toggle, stop }), [current, playing, loading, toggle, stop]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="none" />
      {current && (
        <div
          role="region"
          aria-label="Now playing"
          className="fixed inset-x-3 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-xl backdrop-blur md:bottom-4"
        >
          <div className="flex items-center gap-3 p-2.5 pr-3">
            {current.cover ? (
              <Image src={current.cover} alt="" width={44} height={44} unoptimized className="size-11 rounded-lg object-cover" />
            ) : (
              <div className="size-11 rounded-lg bg-subtle" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{current.title}</p>
              <p className="truncate text-xs text-muted">{current.artist}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(current)}
              aria-label={playing ? "Pause" : "Play"}
              className="grid size-9 place-items-center rounded-full bg-fg text-bg"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-bg/30 border-t-bg" />
              ) : playing ? (
                <Pause className="size-4" fill="currentColor" />
              ) : (
                <Play className="size-4 translate-x-px" fill="currentColor" />
              )}
            </button>
            <button type="button" onClick={stop} aria-label="Close player" className="grid size-8 place-items-center rounded-full text-muted hover:bg-subtle">
              <X className="size-4" />
            </button>
          </div>
          <div className="h-0.5 bg-line">
            <div className="h-full origin-left bg-accent transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

/** Tiny animated equaliser shown on the active track. */
export function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="inline-flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 0.2, 0.4].map((d) => (
        <span
          key={d}
          className="w-[3px] origin-bottom rounded-sm bg-accent"
          style={{ height: "100%", transform: "scaleY(0.3)", animation: active ? `eq 0.9s ${d}s ease-in-out infinite` : undefined }}
        />
      ))}
    </span>
  );
}
