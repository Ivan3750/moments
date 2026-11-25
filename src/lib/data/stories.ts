import "server-only";
import { db } from "@/lib/db";
import type { StoryGroup } from "@/lib/types";
import { toUserLite, userLiteSelect } from "@/lib/data/shared";
import { mediaUrl } from "@/lib/storage";

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;

/** Active stories from the viewer and the people they follow, unseen groups first. */
export async function getStoryTray(viewerId: string): Promise<StoryGroup[]> {
  const now = new Date();
  const users = await db.user.findMany({
    where: {
      stories: { some: { expiresAt: { gt: now } } },
      OR: [{ id: viewerId }, { followers: { some: { followerId: viewerId } } }],
    },
    select: {
      ...userLiteSelect,
      stories: {
        where: { expiresAt: { gt: now } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          key: true,
          width: true,
          height: true,
          createdAt: true,
          views: { where: { viewerId }, select: { viewerId: true } },
        },
      },
    },
  });

  const groups: StoryGroup[] = users.map((u) => {
    const stories = u.stories.map((s) => ({
      id: s.id,
      url: mediaUrl(s.key)!,
      width: s.width,
      height: s.height,
      createdAt: s.createdAt.toISOString(),
      seen: s.views.length > 0,
    }));
    return { user: toUserLite(u), stories, allSeen: stories.every((s) => s.seen) };
  });

  const latest = (g: StoryGroup) => g.stories[g.stories.length - 1].createdAt;
  return groups.sort((a, b) => {
    if (a.user.id === viewerId) return -1;
    if (b.user.id === viewerId) return 1;
    if (a.allSeen !== b.allSeen) return a.allSeen ? 1 : -1;
    return latest(b).localeCompare(latest(a));
  });
}
