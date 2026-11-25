import { apiError, authed, cursorParam, json } from "@/lib/api";
import { getFollowList } from "@/lib/data/users";
import { cuid } from "@/lib/validation";

export async function GET(req: Request) {
  const { viewer, res } = await authed();
  if (res) return res;
  const params = new URL(req.url).searchParams;
  const userId = params.get("userId") ?? "";
  const kind = params.get("kind");
  if (!cuid.safeParse(userId).success || (kind !== "followers" && kind !== "following")) return apiError("Invalid request");
  try {
    return json(await getFollowList(userId, kind, viewer.id, cursorParam(req)));
  } catch {
    return apiError("Invalid cursor");
  }
}
