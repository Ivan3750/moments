"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { ImageView } from "@/lib/types";

/** Instagram keeps feed media between 4:5 (portrait) and 1.91:1 (landscape). */
export const clampRatio = (w: number, h: number) => Math.min(1.91, Math.max(0.8, w / h));

export function MediaCarousel({
  images,
  alt,
  onDoubleTap,
  priority,
  sizes = "(min-width: 768px) 470px, 100vw",
  rounded = false,
}: {
  images: ImageView[];
  alt: string;
  onDoubleTap?: () => void;
  priority?: boolean;
  sizes?: string;
  rounded?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [pops, setPops] = useState(0);
  const lastTap = useRef(0);
  const ratio = clampRatio(images[0].width, images[0].height);

  const go = useCallback((dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  }, []);

  const handleTap = () => {
    if (!onDoubleTap) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      setPops((n) => n + 1);
      onDoubleTap();
    } else {
      lastTap.current = now;
    }
  };

  return (
    <div className={cn("group relative overflow-hidden bg-subtle [touch-action:manipulation]", rounded && "rounded-sm")} style={{ aspectRatio: ratio }}>
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onClick={handleTap}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {images.map((img, i) => (
          <div key={img.url} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={img.url}
              alt={images.length > 1 ? `${alt} (${i + 1} of ${images.length})` : alt}
              fill
              unoptimized
              sizes={sizes}
              priority={priority && i === 0}
              loading={priority && i === 0 ? "eager" : "lazy"}
              placeholder={img.blur ? "blur" : "empty"}
              blurDataURL={img.blur || undefined}
              draggable={false}
              className="select-none object-cover"
            />
          </div>
        ))}
      </div>

      {pops > 0 && (
        <span key={pops} aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <Heart className="animate-heart-pop size-24 fill-white text-white drop-shadow-lg" />
        </span>
      )}

      {images.length > 1 && (
        <>
          {index > 0 && (
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black opacity-0 shadow transition group-hover:opacity-100 md:grid">
              <ChevronLeft className="size-5" />
            </button>
          )}
          {index < images.length - 1 && (
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black opacity-0 shadow transition group-hover:opacity-100 md:grid">
              <ChevronRight className="size-5" />
            </button>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white" aria-hidden>
            {index + 1}/{images.length}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden>
            {images.map((_, i) => (
              <span key={i} className={cn("size-1.5 rounded-full transition", i === index ? "bg-accent" : "bg-white/70")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
