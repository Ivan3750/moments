"use client";

import Image from "next/image";
import Link from "next/link";
import { Copy, Heart, MessageCircle, Music2 } from "lucide-react";
import { Sentinel, useInfinite } from "@/components/post/infinite";
import { formatCount } from "@/lib/format";
import type { GridPostView, Page } from "@/lib/types";

export function PostGrid({ endpoint, initial, empty, gap = "gap-1" }: { endpoint: string; initial: Page<GridPostView>; empty?: React.ReactNode; gap?: string }) {
  const { items, hasMore, loading, error, loadMore } = useInfinite<GridPostView>(endpoint, initial);

  if (items.length === 0) return <>{empty}</>;

  return (
    <>
      <ul className={`grid grid-cols-3 ${gap}`}>
        {items.map((p, i) => (
          <li key={p.id}>
            <Link href={`/p/${p.id}`} className="group relative block aspect-square overflow-hidden bg-subtle" aria-label={`Open post, ${p.likeCount} likes, ${p.commentCount} comments`}>
              <Image
                src={p.image.url}
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 300px, 33vw"
                placeholder={p.image.blur ? "blur" : "empty"}
                blurDataURL={p.image.blur || undefined}
                priority={i < 6}
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute right-2 top-2 flex gap-1.5 text-white drop-shadow">
                {p.hasMusic && <Music2 className="size-4" />}
                {p.multiple && <Copy className="size-4" />}
              </span>
              <span className="absolute inset-0 hidden items-center justify-center gap-6 bg-black/40 font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 md:flex">
                <span className="flex items-center gap-1.5">
                  <Heart className="size-5 fill-white" /> {formatCount(p.likeCount)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="size-5 fill-white" /> {formatCount(p.commentCount)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Sentinel onVisible={loadMore} loading={loading} error={error} hasMore={hasMore} />
    </>
  );
}
