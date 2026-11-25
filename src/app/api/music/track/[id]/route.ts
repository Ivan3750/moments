import { apiError, authed, json } from "@/lib/api";
import { getTrack } from "@/lib/data/music";
import { deezerId } from "@/lib/validation";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { res } = await authed();
  if (res) return res;
  const { id } = await ctx.params;
  if (!deezerId.safeParse(id).success) return apiError("Invalid track");
  const track = await getTrack(id);
  return track ? json({ track }) : apiError("Track unavailable", 404);
}
