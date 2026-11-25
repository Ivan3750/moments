import { apiError, authed, cursorParam, json } from "@/lib/api";
import { getNotifications } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { viewer, res } = await authed();
  if (res) return res;
  try {
    return json(await getNotifications(viewer.id, cursorParam(req)));
  } catch {
    return apiError("Invalid cursor");
  }
}
