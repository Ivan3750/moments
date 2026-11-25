import "server-only";
import { db } from "@/lib/db";
import type { ConversationView, MessageView, UserLite } from "@/lib/types";
import { toUserLite, userLiteSelect } from "@/lib/data/shared";

/** Conversation rows store the two participants in a canonical (sorted) order. */
export const pairOf = (a: string, b: string) => (a < b ? ([a, b] as const) : ([b, a] as const));

export async function getOrCreateConversation(viewerId: string, otherId: string) {
  const [userAId, userBId] = pairOf(viewerId, otherId);
  return db.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
}

export async function listConversations(viewerId: string): Promise<ConversationView[]> {
  const rows = await db.conversation.findMany({
    where: {
      OR: [{ userAId: viewerId }, { userBId: viewerId }],
      messages: { some: {} },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      userA: { select: userLiteSelect },
      userB: { select: userLiteSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return rows.map((c) => {
    const isA = c.userAId === viewerId;
    const last = c.messages[0];
    const readAt = isA ? c.userAReadAt : c.userBReadAt;
    return {
      id: c.id,
      other: toUserLite(isA ? c.userB : c.userA),
      lastMessage: last ? { text: last.text, mine: last.senderId === viewerId, createdAt: last.createdAt.toISOString() } : null,
      unread: !!last && last.senderId !== viewerId && c.lastMessageAt > readAt,
      lastMessageAt: c.lastMessageAt.toISOString(),
    };
  });
}

/** Returns the conversation only if the viewer is a participant. */
export async function getConversationFor(viewerId: string, conversationId: string) {
  const c = await db.conversation.findFirst({
    where: { id: conversationId, OR: [{ userAId: viewerId }, { userBId: viewerId }] },
    include: { userA: { select: userLiteSelect }, userB: { select: userLiteSelect } },
  });
  if (!c) return null;
  const other: UserLite = toUserLite(c.userAId === viewerId ? c.userB : c.userA);
  return { id: c.id, other };
}

export const toMessageView = (m: { id: string; text: string; createdAt: Date; senderId: string }, viewerId: string): MessageView => ({
  id: m.id,
  text: m.text,
  createdAt: m.createdAt.toISOString(),
  mine: m.senderId === viewerId,
});

/** Latest `take` messages (oldest first), or everything at/after `after`. */
export async function getMessages(conversationId: string, viewerId: string, opts: { after?: Date; take?: number } = {}) {
  const take = opts.take ?? 60;
  const rows = opts.after
    ? await db.message.findMany({
        where: { conversationId, createdAt: { gte: opts.after } },
        orderBy: { createdAt: "asc" },
        take: 200,
      })
    : (await db.message.findMany({ where: { conversationId }, orderBy: { createdAt: "desc" }, take })).reverse();
  return rows.map((m) => toMessageView(m, viewerId));
}

export async function markConversationRead(conversationId: string, viewerId: string) {
  const c = await db.conversation.findUnique({ where: { id: conversationId }, select: { userAId: true } });
  if (!c) return;
  await db.conversation.update({
    where: { id: conversationId },
    data: c.userAId === viewerId ? { userAReadAt: new Date() } : { userBReadAt: new Date() },
  });
}
