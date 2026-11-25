import { apiError, authed, cursorParam, json } from "@/lib/api";
import { getExploreGrid, getSavedGrid, getTagGrid, getUserGrid } from "@/lib/data/posts";
import { cuid } from "@/lib/validation";

/** /api/grid?kind=user&key=<userId> | saved | explore | tag&key=<tag> */
export async function GET(req: Request) {
  const { viewer, res } = await authed();
  if (res) return res;
  const params = new URL(req.url).searchParams;
  const kind = params.get("kind");
  const key = params.get("key") ?? "";
  const cursor = cursorParam(req);

  try {
    switch (kind) {
      case "user":
        if (!cuid.safeParse(key).success) return apiError("Invalid user");
        return json(await getUserGrid(key, cursor));
      case "saved":
        return json(await getSavedGrid(viewer.id, cursor)); // always the viewer's own
      case "explore":
        return json(await getExploreGrid(viewer.id, cursor));
      case "tag":
        if (!/^[\p{L}\p{N}_]{1,50}$/u.test(key)) return apiError("Invalid tag");
        return json(await getTagGrid(key.toLowerCase(), cursor));
      default:
        return apiError("Unknown grid");
    }
  } catch {
    return apiError("Invalid cursor");
  }
}
