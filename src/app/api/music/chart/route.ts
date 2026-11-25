import { apiError, authed, json } from "@/lib/api";
import { chartTracks } from "@/lib/data/music";

export async function GET() {
  const { res } = await authed();
  if (res) return res;
  const tracks = await chartTracks();
  return tracks ? json({ tracks }) : apiError("Music service is unavailable", 502);
}
