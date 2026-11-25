import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/post/follow-button";
import type { UserLite } from "@/lib/types";

export function SuggestedUsers({ users, title = "Suggested for you" }: { users: UserLite[]; title?: string }) {
  if (users.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>
      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3">
            <Link href={`/${u.username}`}>
              <Avatar user={u} size={44} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/${u.username}`} className="block truncate text-sm font-semibold hover:opacity-70">
                {u.username}
              </Link>
              <p className="truncate text-sm text-muted">{u.name || "Suggested for you"}</p>
            </div>
            <FollowButton userId={u.id} initialFollowing={false} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}
