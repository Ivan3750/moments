import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { CommentView, GridPostView, Page, PostView } from "@/lib/types";
import { cursorArgs, toImageView, toPage, toUserLite, userLiteSelect } from "@/lib/data/shared";

const ORDER = [{ createdAt: "desc" }, { id: "desc" }] as const satisfies Prisma.PostOrderByWithRelationInput[];

function postArgs(viewerId: string) {
  return {
    include: {
      author: { select: userLiteSelect },
      images: { orderBy: { position: "asc" } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: viewerId }, select: { userId: true } },
      saves: { where: { userId: viewerId }, select: { userId: true } },
      comments: { orderBy: { createdAt: "desc" }, take: 2, include: { author: { select: userLiteSelect } } },
    },
  } as const satisfies Prisma.PostDefaultArgs;
}

type PostRow = Prisma.PostGetPayload<ReturnType<typeof postArgs>>;

export function toCommentView(c: {
  id: string;
  text: string;
  createdAt: Date;
  author: { id: string; username: string; name: string; avatarKey: string | null };
}): CommentView {
  return { id: c.id, text: c.text, createdAt: c.createdAt.toISOString(), author: toUserLite(c.author) };
}

function toPostView(p: PostRow): PostView {
  return {
    id: p.id,
    caption: p.caption,
    createdAt: p.createdAt.toISOString(),
    author: toUserLite(p.author),
    images: p.images.map(toImageView),
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    liked: p.likes.length > 0,
    saved: p.saves.length > 0,
    music: p.musicId
      ? { id: p.musicId, title: p.musicTitle ?? "", artist: p.musicArtist ?? "", cover: p.musicCover ?? "" }
      : null,
    preview: p.comments.map(toCommentView).reverse(),
  };
}

/** Posts from people the viewer follows, plus their own. */
export async function getFeed(viewerId: string, cursor?: string | null, take = 5): Promise<Page<PostView>> {
  const rows = await db.post.findMany({
    where: { OR: [{ authorId: viewerId }, { author: { followers: { some: { followerId: viewerId } } } }] },
    orderBy: [...ORDER],
    ...cursorArgs(cursor, take),
    ...postArgs(viewerId),
  });
  return toPage(rows, take, toPostView);
}

export async function getPost(id: string, viewerId: string): Promise<PostView | null> {
  const row = await db.post.findUnique({ where: { id }, ...postArgs(viewerId) });
  return row ? toPostView(row) : null;
}

export async function getComments(postId: string, cursor?: string | null, take = 20): Promise<Page<CommentView>> {
  const rows = await db.comment.findMany({
    where: { postId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    ...cursorArgs(cursor, take),
    include: { author: { select: userLiteSelect } },
  });
  return toPage(rows, take, toCommentView);
}

// ---- grids ---------------------------------------------------------------

const gridArgs = {
  include: {
    images: { orderBy: { position: "asc" }, take: 1 },
    _count: { select: { likes: true, comments: true, images: true } },
  },
} as const satisfies Prisma.PostDefaultArgs;

type GridRow = Prisma.PostGetPayload<typeof gridArgs>;

function toGrid(p: GridRow): GridPostView {
  return {
    id: p.id,
    image: toImageView(p.images[0]),
    multiple: p._count.images > 1,
    hasMusic: !!p.musicId,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
  };
}

const withImages = (extra: Prisma.PostWhereInput = {}): Prisma.PostWhereInput => ({ images: { some: {} }, ...extra });

export async function getUserGrid(userId: string, cursor?: string | null, take = 12) {
  const rows = await db.post.findMany({
    where: withImages({ authorId: userId }),
    orderBy: [...ORDER],
    ...cursorArgs(cursor, take),
    ...gridArgs,
  });
  return toPage(rows, take, toGrid);
}

export async function getSavedGrid(viewerId: string, cursor?: string | null, take = 12) {
  // Page over the Save join table (ordered by when it was saved), then map to posts.
  const saves = await db.save.findMany({
    where: { userId: viewerId },
    orderBy: [{ createdAt: "desc" }, { postId: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { userId_postId: { userId: viewerId, postId: cursor } }, skip: 1 } : {}),
    include: { post: gridArgs },
  });
  const hasMore = saves.length > take;
  const slice = hasMore ? saves.slice(0, take) : saves;
  return {
    items: slice.filter((s) => s.post.images.length > 0).map((s) => toGrid(s.post)),
    nextCursor: hasMore ? slice[slice.length - 1].postId : null,
  } satisfies Page<GridPostView>;
}

/** Explore: other people's posts, most-liked first, newest as the tiebreaker. */
export async function getExploreGrid(viewerId: string, cursor?: string | null, take = 18) {
  const rows = await db.post.findMany({
    where: withImages({ authorId: { not: viewerId } }),
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }, { id: "desc" }],
    ...cursorArgs(cursor, take),
    ...gridArgs,
  });
  return toPage(rows, take, toGrid);
}

export async function getTagGrid(tag: string, cursor?: string | null, take = 18) {
  const rows = await db.post.findMany({
    where: withImages({ tags: { some: { tag } } }),
    orderBy: [...ORDER],
    ...cursorArgs(cursor, take),
    ...gridArgs,
  });
  return toPage(rows, take, toGrid);
}

export async function countTag(tag: string) {
  return db.postTag.count({ where: { tag } });
}

export async function searchTags(query: string, take = 6) {
  const q = query.toLowerCase().replace(/^#/, "");
  if (!q) return [];
  const rows = await db.postTag.groupBy({
    by: ["tag"],
    where: { tag: { startsWith: q } },
    _count: { tag: true },
    orderBy: { _count: { tag: "desc" } },
    take,
  });
  return rows.map((r) => ({ tag: r.tag, count: r._count.tag }));
}
