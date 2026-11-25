import "server-only";
import { db } from "@/lib/db";
import type { Page, ProfileView, UserLite } from "@/lib/types";
import { cursorArgs, toPage, toUserLite, userLiteSelect } from "@/lib/data/shared";
import { mediaUrl } from "@/lib/storage";

export async function getProfile(username: string, viewerId: string): Promise<ProfileView | null> {
  const u = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      ...userLiteSelect,
      bio: true,
      website: true,
      createdAt: true,
      _count: { select: { posts: true, followers: true, following: true } },
      followers: { where: { followerId: viewerId }, select: { followerId: true } },
      following: { where: { followingId: viewerId }, select: { followingId: true } },
    },
  });
  if (!u) return null;
  return {
    ...toUserLite(u),
    bio: u.bio,
    website: u.website,
    createdAt: u.createdAt.toISOString(),
    postCount: u._count.posts,
    followerCount: u._count.followers,
    followingCount: u._count.following,
    isMe: u.id === viewerId,
    isFollowing: u.followers.length > 0,
    followsYou: u.following.length > 0,
  };
}

export type UserRow = UserLite & { isFollowing: boolean; isMe: boolean };

/** Followers or following of a user, with the viewer's follow state for each row. */
export async function getFollowList(
  userId: string,
  kind: "followers" | "following",
  viewerId: string,
  cursor?: string | null,
  take = 30,
): Promise<Page<UserRow>> {
  const where = kind === "followers" ? { followingId: userId } : { followerId: userId };
  const rows = await db.follow.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, kind === "followers" ? { followerId: "desc" } : { followingId: "desc" }],
    take: take + 1,
    ...(cursor
      ? {
          cursor:
            kind === "followers"
              ? { followerId_followingId: { followerId: cursor, followingId: userId } }
              : { followerId_followingId: { followerId: userId, followingId: cursor } },
          skip: 1,
        }
      : {}),
    include: {
      follower: { select: { ...userLiteSelect, followers: { where: { followerId: viewerId }, select: { followerId: true } } } },
      following: { select: { ...userLiteSelect, followers: { where: { followerId: viewerId }, select: { followerId: true } } } },
    },
  });
  const hasMore = rows.length > take;
  const slice = hasMore ? rows.slice(0, take) : rows;
  const items = slice.map((r) => {
    const u = kind === "followers" ? r.follower : r.following;
    return { ...toUserLite(u), isFollowing: u.followers.length > 0, isMe: u.id === viewerId };
  });
  const last = slice[slice.length - 1];
  const nextCursor = hasMore && last ? (kind === "followers" ? last.followerId : last.followingId) : null;
  return { items, nextCursor };
}

export async function searchUsers(query: string, take = 8): Promise<UserLite[]> {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return [];
  const rows = await db.user.findMany({
    where: { OR: [{ username: { contains: q } }, { name: { contains: q } }] },
    orderBy: [{ followers: { _count: "desc" } }, { username: "asc" }],
    take,
    select: userLiteSelect,
  });
  // Exact / prefix username matches first.
  return rows
    .sort((a, b) => Number(b.username.startsWith(q)) - Number(a.username.startsWith(q)))
    .map(toUserLite);
}

export async function getSuggestedUsers(viewerId: string, take = 5): Promise<UserLite[]> {
  const rows = await db.user.findMany({
    where: { id: { not: viewerId }, followers: { none: { followerId: viewerId } } },
    orderBy: [{ followers: { _count: "desc" } }, { createdAt: "desc" }],
    take,
    select: userLiteSelect,
  });
  return rows.map(toUserLite);
}

export const avatarUrl = mediaUrl;

// Re-export for pages that only need the page helper.
export { cursorArgs, toPage };
