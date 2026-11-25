import { requireViewer } from "@/lib/auth";
import { listConversations } from "@/lib/data/messages";
import { MessagesShell } from "@/components/messages/messages-shell";

export const dynamic = "force-dynamic";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const conversations = await listConversations(viewer.id);
  return <MessagesShell conversations={conversations}>{children}</MessagesShell>;
}
