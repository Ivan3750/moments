import "server-only";
import { db } from "@/lib/db";
import type { NotificationView, Page } from "@/lib/types";
import { cursorArgs, toImageView, toPage, toUserLite, userLiteSelect } from "@/lib/data/shared";
import { mediaUrl } from "@/lib/storage";

type NotifType = "like" | "comment" | "follow";

/** Never notifies people about their own actions. */
export async function notify(input: {
  recipientId: string;
  actorId: string;
  type: NotifType;
  postId?: string;
  text?: string;
}) {
  if (input.recipientId === input.actorId) return;
  await db.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId,
      text: (input.text ?? "").slice(0, 200),
    },
  });
}

/** Called on unlike/unfollow so repeated toggling doesn't spam the recipient. */
export async function unnotify(input: { recipientId: string; actorId: string; type: NotifType; postId?: string }) {
  await db.notification.deleteMany({
    where: { recipientId: input.recipientId, actorId: input.actorId, type: input.type, postId: input.postId ?? null },
  });
}

export async function getNotifications(viewerId: string, cursor?: string | null, take = 25): Promise<Page<NotificationView>> {
  const rows = await db.notification.findMany({
    where: { recipientId: viewerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...cursorArgs(cursor, take),
    include: {
      actor: { select: { ...userLiteSelect, followers: { where: { followerId: viewerId }, select: { followerId: true } } } },
      post: { select: { images: { orderBy: { position: "asc" }, take: 1, select: { key: true, width: true, height: true, blur: true } } } },
    },
  });
  return toPage(rows, take, (n) => ({
    id: n.id,
    type: n.type as NotificationView["type"],
    actor: toUserLite(n.actor),
    text: n.text,
    createdAt: n.createdAt.toISOString(),
    read: !!n.readAt,
    post: n.postId ? { id: n.postId, image: n.post?.images[0] ? toImageView(n.post.images[0]).url : null } : null,
    following: n.actor.followers.length > 0,
  }));
}

export async function markNotificationsRead(viewerId: string) {
  await db.notification.updateMany({ where: { recipientId: viewerId, readAt: null }, data: { readAt: new Date() } });
}

export async function getUnreadCounts(viewerId: string) {
  const [notifications, convos] = await Promise.all([
    db.notification.count({ where: { recipientId: viewerId, readAt: null } }),
    db.conversation.findMany({
      where: { OR: [{ userAId: viewerId }, { userBId: viewerId }] },
      select: {
        userAId: true,
        userAReadAt: true,
        userBReadAt: true,
        lastMessageAt: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true } },
      },
    }),
  ]);
  const messages = convos.filter((c) => {
    const last = c.messages[0];
    if (!last || last.senderId === viewerId) return false;
    const readAt = c.userAId === viewerId ? c.userAReadAt : c.userBReadAt;
    return c.lastMessageAt > readAt;
  }).length;
  return { notifications, messages };
}

export { mediaUrl };
