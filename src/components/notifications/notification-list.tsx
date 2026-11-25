"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { FollowButton } from "@/components/post/follow-button";
import { Sentinel, useInfinite } from "@/components/post/infinite";
import { useUnread } from "@/components/shell/unread";
import { markAllNotificationsRead } from "@/actions/social";
import { timeAgo } from "@/lib/format";
import type { NotificationView, Page } from "@/lib/types";

function describe(n: NotificationView) {
  if (n.type === "like") return "liked your photo.";
  if (n.type === "follow") return "started following you.";
  return <>commented: <span className="text-muted">{n.text}</span></>;
}

export function NotificationList({ initial }: { initial: Page<NotificationView> }) {
  const { items, hasMore, loading, error, loadMore } = useInfinite<NotificationView>("/api/notifications", initial);
  const { refresh } = useUnread();

  // Opening the page counts as reading everything (the highlight below still reflects the state at load time).
  useEffect(() => {
    void markAllNotificationsRead().then(refresh);
  }, [refresh]);

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <Bell className="mx-auto mb-3 size-12 text-muted" strokeWidth={1.25} />
        <h2 className="text-xl font-semibold">No activity yet</h2>
        <p className="mt-1 text-muted">When someone likes or comments on your posts, or follows you, you&apos;ll see it here.</p>
      </div>
    );
  }

  return (
    <>
      <ul>
        {items.map((n) => (
          <li key={n.id} className={cn("flex items-center gap-3 px-4 py-3", !n.read && "bg-accent/8")}>
            <Link href={`/${n.actor.username}`} className="shrink-0">
              <Avatar user={n.actor} size={44} />
            </Link>
            <p className="min-w-0 flex-1 break-words text-sm">
              <Link href={`/${n.actor.username}`} className="font-semibold hover:opacity-70">
                {n.actor.username}
              </Link>{" "}
              {describe(n)}{" "}
              <time dateTime={n.createdAt} suppressHydrationWarning className="text-muted">
                {timeAgo(n.createdAt)}
              </time>
            </p>
            {n.type === "follow" ? (
              <FollowButton userId={n.actor.id} initialFollowing={n.following} followsYou size="sm" />
            ) : n.post ? (
              <Link href={`/p/${n.post.id}`} aria-label="Open post" className="relative block size-11 shrink-0 overflow-hidden rounded bg-subtle">
                {n.post.image && <Image src={n.post.image} alt="" fill unoptimized sizes="44px" className="object-cover" />}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <Sentinel onVisible={loadMore} loading={loading} error={error} hasMore={hasMore} />
    </>
  );
}
