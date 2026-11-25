"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action";
import { captionSchema, commentSchema, cuid } from "@/lib/validation";
import { extractHashtags } from "@/lib/format";
import { notify, unnotify } from "@/lib/data/notifications";
import { deleteImages } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { toCommentView } from "@/lib/data/posts";
import { userLiteSelect } from "@/lib/data/shared";
import type { CommentView } from "@/lib/types";

async function viewerOrNull() {
  return getViewer();
}

/** Idempotent: the client says which state it wants, so double-taps and retries can't drift. */
export async function setLike(postId: string, liked: boolean): Promise<ActionResult<{ liked: boolean; likeCount: number }>> {
  const viewer = await viewerOrNull();
  if (!viewer) return fail("Please log in");
  if (!cuid.safeParse(postId).success) return fail("Invalid post");

  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return fail("This post no longer exists");

  if (liked) {
    const created = await db.like.createMany({ data: [{ userId: viewer.id, postId }] }).catch(() => ({ count: 0 }));
    if (created.count > 0) await notify({ recipientId: post.authorId, actorId: viewer.id, type: "like", postId });
  } else {
    const removed = await db.like.deleteMany({ where: { userId: viewer.id, postId } });
    if (removed.count > 0) await unnotify({ recipientId: post.authorId, actorId: viewer.id, type: "like", postId });
  }
  return ok({ liked, likeCount: await db.like.count({ where: { postId } }) });
}

export async function setSave(postId: string, saved: boolean): Promise<ActionResult<{ saved: boolean }>> {
  const viewer = await viewerOrNull();
  if (!viewer) return fail("Please log in");
  if (!cuid.safeParse(postId).success) return fail("Invalid post");

  if (saved) {
    if (!(await db.post.count({ where: { id: postId } }))) return fail("This post no longer exists");
    await db.save.createMany({ data: [{ userId: viewer.id, postId }] }).catch(() => undefined);
  } else {
    await db.save.deleteMany({ where: { userId: viewer.id, postId } });
  }
  return ok({ saved });
}

export async function addComment(postId: string, text: string): Promise<ActionResult<CommentView>> {
  const viewer = await viewerOrNull();
  if (!viewer) return fail("Please log in");
  if (!cuid.safeParse(postId).success) return fail("Invalid post");

  const parsed = commentSchema.safeParse(text);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const limit = rateLimit(`comment:${viewer.id}`, 20, 60 * 1000);
  if (!limit.ok) return fail("You're commenting too fast. Slow down a little.");

  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return fail("This post no longer exists");

  const comment = await db.comment.create({
    data: { postId, authorId: viewer.id, text: parsed.data },
    include: { author: { select: userLiteSelect } },
  });
  await notify({ recipientId: post.authorId, actorId: viewer.id, type: "comment", postId, text: parsed.data });
  return ok(toCommentView(comment));
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const viewer = await viewerOrNull();
  if (!viewer) return fail("Please log in");
  if (!cuid.safeParse(commentId).success) return fail("Invalid comment");

  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { authorId: true, post: { select: { authorId: true } } } });
  if (!comment) return ok(undefined);
  // The commenter and the post's owner may delete a comment.
  if (comment.authorId !== viewer.id && comment.post.authorId !== viewer.id) return fail("You can't delete this comment");
  await db.comment.delete({ where: { id: commentId } });
  return ok(undefined);
}

export async function updateCaption(postId: string, caption: string): Promise<ActionResult<{ caption: string }>> {
  const viewer = await viewerOrNull();
  if (!viewer) return fail("Please log in");
  const parsed = captionSchema.safeParse(caption);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post || post.authorId !== viewer.id) return fail("You can't edit this post");

  const tags = extractHashtags(parsed.data);
  await db.$transaction([
    db.post.update({ where: { id: postId }, data: { caption: parsed.data } }),
    db.postTag.deleteMany({ where: { postId } }),
    ...(tags.length ? [db.postTag.createMany({ data: tags.map((tag) => ({ postId, tag })) })] : []),
  ]);
  revalidatePath(`/p/${postId}`);
  return ok({ caption: parsed.data });
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const viewer = await viewerOrNull();
  if (!viewer) return fail("Please log in");
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true, images: { select: { key: true } } } });
  if (!post) return ok(undefined);
  if (post.authorId !== viewer.id) return fail("You can't delete this post");

  await db.post.delete({ where: { id: postId } });
  await deleteImages(post.images.map((i) => i.key));
  revalidatePath(`/${viewer.username}`);
  return ok(undefined);
}
