import { apiError, authed, json } from "@/lib/api";
import { searchTracks } from "@/lib/data/music";

export async function GET(req: Request) {
  const { res } = await authed();
  if (res) return res;
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const tracks = await searchTracks(q);
  return tracks ? json({ tracks }) : apiError("Music service is unavailable", 502);
}
