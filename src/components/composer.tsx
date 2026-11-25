"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Music2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button, Spinner } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { TrackBrowser } from "@/components/music/track-browser";
import type { TrackView } from "@/lib/types";

type Mode = "post" | "story";
const Ctx = createContext<{ open: (mode?: Mode) => void }>({ open: () => {} });
export const useComposer = () => useContext(Ctx);

const MAX_IMAGES = 10;
const MAX_BYTES = 12 * 1024 * 1024;
const MAX_CAPTION = 2200;

type Picked = { id: string; file: File; url: string };

/** XHR instead of fetch so we can show upload progress. */
function upload(url: string, body: FormData, onProgress: (p: number) => void): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(new Error("Network error. Check your connection and try again."));
    xhr.onload = () => {
      let data: { id?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.id) resolve({ id: data.id });
      else reject(new Error(data.error ?? "Upload failed"));
    };
    xhr.send(body);
  });
}

export function ComposerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const open = useCallback((m: Mode = "post") => setMode(m), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ComposerDialog mode={mode} onClose={() => setMode(null)} onModeChange={setMode} />
    </Ctx.Provider>
  );
}

function ComposerDialog({ mode, onClose, onModeChange }: { mode: Mode | null; onClose: () => void; onModeChange: (m: Mode) => void }) {
  return (
    <Modal open={mode !== null} onClose={onClose} title="Create" className="w-[min(94vw,52rem)]" hideClose>
      {mode && <ComposerBody key={mode} mode={mode} onClose={onClose} onModeChange={onModeChange} />}
    </Modal>
  );
}

function ComposerBody({ mode, onClose, onModeChange }: { mode: Mode; onClose: () => void; onModeChange: (m: Mode) => void }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked[]>([]);
  const [active, setActive] = useState(0);
  const [caption, setCaption] = useState("");
  const [track, setTrack] = useState<TrackView | null>(null);
  const [pickingMusic, setPickingMusic] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);
  const max = mode === "story" ? 1 : MAX_IMAGES;
  const busy = progress !== null;

  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const files = Array.from(list);
      const next: Picked[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} isn't an image`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is larger than 12 MB`);
          continue;
        }
        const url = URL.createObjectURL(file);
        urlsRef.current.push(url);
        next.push({ id: crypto.randomUUID(), file, url });
      }
      setPicked((prev) => {
        const merged = mode === "story" ? next.slice(0, 1) : [...prev, ...next];
        if (merged.length > max) toast.error(`You can add up to ${max} photos`);
        return merged.slice(0, max);
      });
    },
    [max, mode],
  );

  const remove = (id: string) =>
    setPicked((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setActive((a) => Math.min(a, Math.max(0, next.length - 1)));
      return next;
    });

  async function submit() {
    if (picked.length === 0 || busy) return;
    setProgress(0);
    try {
      const form = new FormData();
      let url: string;
      if (mode === "story") {
        form.append("image", picked[0].file);
        url = "/api/stories";
      } else {
        picked.forEach((p) => form.append("images", p.file));
        form.append("caption", caption);
        if (track) form.append("musicId", track.id);
        url = "/api/posts";
      }
      const { id } = await upload(url, form, setProgress);
      toast.success(mode === "story" ? "Story shared" : "Post shared", {
        action: mode === "post" ? { label: "View", onClick: () => router.push(`/p/${id}`) } : undefined,
      });
      onClose();
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setProgress(null);
    }
  }

  const hasPhotos = picked.length > 0;
  const current = picked[active] ?? picked[0];

  return (
    <div className="flex max-h-[92dvh] flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-3">
        {pickingMusic ? (
          <button type="button" onClick={() => setPickingMusic(false)} aria-label="Back" className="grid size-8 place-items-center rounded-full hover:bg-subtle">
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="grid size-8 place-items-center rounded-full hover:bg-subtle disabled:opacity-40">
            <X className="size-5" />
          </button>
        )}

        {pickingMusic ? (
          <h2 className="text-sm font-semibold">Add music</h2>
        ) : (
          <div role="tablist" aria-label="What are you sharing?" className="flex rounded-lg bg-subtle p-0.5 text-sm font-semibold">
            {(["post", "story"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                type="button"
                disabled={busy}
                onClick={() => onModeChange(m)}
                className={cn("rounded-md px-3 py-1 capitalize transition", mode === m ? "bg-bg shadow-sm" : "text-muted")}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {pickingMusic ? (
          <span className="w-8" />
        ) : (
          <Button size="sm" variant="ghost" onClick={submit} disabled={!hasPhotos || busy} className="text-accent">
            {busy && <Spinner />}
            {mode === "story" ? "Share" : "Share"}
          </Button>
        )}
      </header>

      {busy && (
        <div className="h-0.5 w-full bg-line" role="progressbar" aria-valuenow={Math.round((progress ?? 0) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.max(5, (progress ?? 0) * 100)}%` }} />
        </div>
      )}

      {pickingMusic ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TrackBrowser
            autoFocus
            pickedId={track?.id}
            onPick={(t) => {
              setTrack(t);
              setPickingMusic(false);
            }}
          />
        </div>
      ) : !hasPhotos ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn("m-4 flex min-h-[22rem] flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed text-center transition", dragging ? "border-accent bg-accent/5" : "border-line")}
        >
          <ImagePlus className="size-14 text-muted" strokeWidth={1.25} />
          <p className="text-lg">{mode === "story" ? "Choose a photo for your story" : "Drag photos here"}</p>
          <Button onClick={() => inputRef.current?.click()}>Select from device</Button>
          <p className="text-xs text-muted">JPG, PNG, WebP or GIF · up to 12 MB{mode === "post" ? ` · up to ${MAX_IMAGES} photos` : ""}</p>
        </div>
      ) : (
        <div className={cn("min-h-0 flex-1 overflow-y-auto", mode === "post" ? "md:grid md:grid-cols-[1.4fr_1fr] md:overflow-hidden" : "")}>
          <div className={cn("relative bg-black", mode === "story" ? "mx-auto aspect-[9/16] max-h-[70dvh]" : "aspect-square md:aspect-auto md:h-full md:min-h-[28rem]")}>
            {current && <Image src={current.url} alt="Preview" fill unoptimized className={cn(mode === "story" ? "object-contain" : "object-contain")} />}
            {picked.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 overflow-x-auto bg-gradient-to-t from-black/70 to-transparent p-2 no-scrollbar">
                {picked.map((p, i) => (
                  <div key={p.id} className="relative shrink-0">
                    <button type="button" onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`} className={cn("block size-14 overflow-hidden rounded-lg ring-2", i === active ? "ring-white" : "ring-transparent opacity-70")}>
                      <Image src={p.url} alt="" width={56} height={56} unoptimized className="size-14 object-cover" />
                    </button>
                    <button type="button" onClick={() => remove(p.id)} aria-label={`Remove photo ${i + 1}`} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-black/80 text-white">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {picked.length < max && (
                  <button type="button" onClick={() => inputRef.current?.click()} aria-label="Add more photos" className="grid size-14 shrink-0 place-items-center rounded-lg bg-white/20 text-white">
                    <Plus className="size-5" />
                  </button>
                )}
              </div>
            )}
            {picked.length === 1 && (
              <button type="button" onClick={() => remove(picked[0].id)} aria-label="Remove photo" className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-black/50 text-white">
                <X className="size-4" />
              </button>
            )}
          </div>

          {mode === "post" && (
            <div className="flex flex-col gap-3 p-4 md:overflow-y-auto">
              <div>
                <label htmlFor="caption" className="sr-only">
                  Caption
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  maxLength={MAX_CAPTION}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption… use #hashtags and @mentions"
                  rows={6}
                  className="w-full resize-none rounded-xl border border-line bg-subtle p-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
                <p className="mt-1 text-right text-xs text-muted">
                  {caption.length}/{MAX_CAPTION}
                </p>
              </div>

              {track ? (
                <div className="flex items-center gap-3 rounded-xl border border-line p-2">
                  {track.cover && <Image src={track.cover} alt="" width={40} height={40} unoptimized className="size-10 rounded-md" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{track.title}</p>
                    <p className="truncate text-xs text-muted">{track.artist}</p>
                  </div>
                  <button type="button" onClick={() => setTrack(null)} aria-label="Remove music" className="grid size-8 place-items-center rounded-full hover:bg-subtle">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setPickingMusic(true)} className="flex items-center gap-2 rounded-xl border border-line p-3 text-left text-sm font-medium hover:bg-subtle">
                  <Music2 className="size-5" /> Add music
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={mode === "post"}
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
