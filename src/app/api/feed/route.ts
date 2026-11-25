import { apiError, authed, cursorParam, json } from "@/lib/api";
import { getFeed } from "@/lib/data/posts";

export async function GET(req: Request) {
  const { viewer, res } = await authed();
  if (res) return res;
  try {
    return json(await getFeed(viewer.id, cursorParam(req)));
  } catch {
    return apiError("Invalid cursor");
  }
}
