import { authed, json } from "@/lib/api";
import { getUnreadCounts } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const { viewer, res } = await authed();
  if (res) return res;
  return json(await getUnreadCounts(viewer.id), { headers: { "Cache-Control": "no-store" } });
}
