"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/post/follow-button";
import { Sentinel, useInfinite } from "@/components/post/infinite";
import type { Page } from "@/lib/types";
import type { UserRow } from "@/lib/data/users";

export function UserList({ endpoint, initial, emptyText }: { endpoint: string; initial: Page<UserRow>; emptyText: string }) {
  const { items, hasMore, loading, error, loadMore } = useInfinite<UserRow>(endpoint, initial);
  if (items.length === 0) return <p className="py-16 text-center text-muted">{emptyText}</p>;
  return (
    <>
      <ul className="divide-y divide-line">
        {items.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-4 py-3">
            <Link href={`/${u.username}`}>
              <Avatar user={u} size={48} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/${u.username}`} className="block truncate text-sm font-semibold hover:opacity-70">
                {u.username}
              </Link>
              {u.name && <p className="truncate text-sm text-muted">{u.name}</p>}
            </div>
            {!u.isMe && <FollowButton userId={u.id} initialFollowing={u.isFollowing} size="sm" />}
          </li>
        ))}
      </ul>
      <Sentinel onVisible={loadMore} loading={loading} error={error} hasMore={hasMore} />
    </>
  );
}
