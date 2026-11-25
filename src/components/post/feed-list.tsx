"use client";

import { PostCard } from "@/components/post/post-card";
import { Sentinel, useInfinite } from "@/components/post/infinite";
import type { Page, PostView } from "@/lib/types";

export function FeedList({ initial, viewerId }: { initial: Page<PostView>; viewerId: string }) {
  const { items, hasMore, loading, error, loadMore } = useInfinite<PostView>("/api/feed", initial);
  return (
    <div>
      {items.map((post, i) => (
        <PostCard key={post.id} post={post} viewerId={viewerId} priority={i === 0} />
      ))}
      <Sentinel onVisible={loadMore} loading={loading} error={error} hasMore={hasMore} />
      {!hasMore && items.length > 0 && (
        <p className="py-10 text-center text-sm text-muted">You&apos;re all caught up ✨</p>
      )}
    </div>
  );
}
