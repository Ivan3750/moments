import { apiError, authed, json } from "@/lib/api";
import { getConversationFor, getMessages, markConversationRead } from "@/lib/data/messages";
import { cuid } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Polled by the open thread: returns messages created at/after `after` (ISO date). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await authed();
  if (res) return res;
  const { id } = await ctx.params;
  if (!cuid.safeParse(id).success) return apiError("Invalid conversation");
  if (!(await getConversationFor(viewer.id, id))) return apiError("Not found", 404);

  const afterParam = new URL(req.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;
  if (after && Number.isNaN(after.getTime())) return apiError("Invalid date");

  const messages = await getMessages(id, viewer.id, { after });
  if (messages.some((m) => !m.mine)) await markConversationRead(id, viewer.id);
  return json({ messages }, { headers: { "Cache-Control": "no-store" } });
}
