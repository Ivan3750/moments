import type { Metadata } from "next";
import Link from "next/link";
import { Camera } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";
import { getFeed } from "@/lib/data/posts";
import { getStoryTray } from "@/lib/data/stories";
import { getSuggestedUsers } from "@/lib/data/users";
import { StoryTray } from "@/components/stories/story-tray";
import { FeedList } from "@/components/post/feed-list";
import { SuggestedUsers } from "@/components/suggested-users";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const viewer = await requireViewer();
  const [feed, stories, suggestions] = await Promise.all([
    getFeed(viewer.id),
    getStoryTray(viewer.id),
    getSuggestedUsers(viewer.id, 5),
  ]);
  const me = { id: viewer.id, username: viewer.username, name: viewer.name, avatar: mediaUrl(viewer.avatarKey) };

  return (
    <div className="flex justify-center gap-12 pt-0 md:pt-6 xl:gap-20">
      <div className="w-full max-w-[470px]">
        <StoryTray groups={stories} viewer={me} />

        {feed.items.length > 0 ? (
          <FeedList initial={feed} viewerId={viewer.id} />
        ) : (
          <div className="mt-6 px-4 text-center md:px-0">
            <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full border-2 border-fg">
              <Camera className="size-9" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold">Your feed is empty</h1>
            <p className="mx-auto mt-2 max-w-xs text-muted">Follow people to see their photos here, or share your first moment.</p>
            <Link href="/explore" className={buttonClass("primary", "md", "mt-5")}>
              Find people to follow
            </Link>
            {suggestions.length > 0 && (
              <div className="mt-10 text-left">
                <SuggestedUsers users={suggestions} />
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="hidden w-[300px] shrink-0 xl:block" aria-label="Suggestions">
        <div className="sticky top-8 space-y-6">
          <Link href={`/${viewer.username}`} className="flex items-center gap-3">
            <Avatar user={me} size={56} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{viewer.username}</p>
              <p className="truncate text-sm text-muted">{viewer.name || "Your profile"}</p>
            </div>
          </Link>
          {feed.items.length > 0 && <SuggestedUsers users={suggestions} />}
        </div>
      </aside>
    </div>
  );
}
