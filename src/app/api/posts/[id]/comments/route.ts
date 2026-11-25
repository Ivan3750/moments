import { apiError, authed, cursorParam, json } from "@/lib/api";
import { getComments } from "@/lib/data/posts";
import { cuid } from "@/lib/validation";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { res } = await authed();
  if (res) return res;
  const { id } = await ctx.params;
  if (!cuid.safeParse(id).success) return apiError("Invalid post");
  try {
    return json(await getComments(id, cursorParam(req)));
  } catch {
    return apiError("Invalid cursor");
  }
}
