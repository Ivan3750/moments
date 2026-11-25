import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { getConversationFor, getMessages } from "@/lib/data/messages";
import { Thread } from "@/components/messages/thread";
import { cuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  if (!cuid.safeParse(id).success) notFound();
  const convo = await getConversationFor(viewer.id, id);
  if (!convo) notFound();
  const messages = await getMessages(id, viewer.id);
  return <Thread key={id} conversationId={id} other={convo.other} initial={messages} />;
}
