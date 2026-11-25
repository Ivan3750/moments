"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action";
import { cuid, messageSchema } from "@/lib/validation";
import { getConversationFor, getOrCreateConversation, markConversationRead, toMessageView } from "@/lib/data/messages";
import { markNotificationsRead } from "@/lib/data/notifications";
import { deleteImages } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import type { MessageView } from "@/lib/types";

export async function markStoryViewed(storyId: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer || !cuid.safeParse(storyId).success) return;
  const story = await db.story.findFirst({ where: { id: storyId, expiresAt: { gt: new Date() } }, select: { id: true } });
  if (!story) return;
  await db.storyView.upsert({
    where: { storyId_viewerId: { storyId, viewerId: viewer.id } },
    update: {},
    create: { storyId, viewerId: viewer.id },
  });
}

export async function deleteStory(storyId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return fail("Please log in");
  const story = await db.story.findUnique({ where: { id: storyId }, select: { authorId: true, key: true } });
  if (!story) return ok(undefined);
  if (story.authorId !== viewer.id) return fail("You can't delete this story");
  await db.story.delete({ where: { id: storyId } });
  await deleteImages([story.key]);
  return ok(undefined);
}

export async function markAllNotificationsRead() {
  const viewer = await getViewer();
  if (viewer) await markNotificationsRead(viewer.id);
}

/** Opens (creating if needed) the DM thread with a user and navigates to it. */
export async function openConversation(userId: string) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!cuid.safeParse(userId).success || userId === viewer.id) redirect("/messages");
  const other = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!other) redirect("/messages");
  const convo = await getOrCreateConversation(viewer.id, other.id);
  redirect(`/messages/${convo.id}`);
}

export async function sendMessage(conversationId: string, text: string): Promise<ActionResult<MessageView>> {
  const viewer = await getViewer();
  if (!viewer) return fail("Please log in");
  const parsed = messageSchema.safeParse(text);
  if (!parsed.success) return fail("Write a message first");

  const limit = rateLimit(`msg:${viewer.id}`, 40, 60 * 1000);
  if (!limit.ok) return fail("You're sending messages too fast.");

  const convo = await getConversationFor(viewer.id, conversationId);
  if (!convo) return fail("Conversation not found");

  const message = await db.message.create({ data: { conversationId, senderId: viewer.id, text: parsed.data } });
  await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: message.createdAt } });
  await markConversationRead(conversationId, viewer.id);
  return ok(toMessageView(message, viewer.id));
}

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer || !cuid.safeParse(conversationId).success) return;
  if (await getConversationFor(viewer.id, conversationId)) await markConversationRead(conversationId, viewer.id);
}
