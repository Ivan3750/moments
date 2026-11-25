import "server-only";
import type { TrackView } from "@/lib/types";

/**
 * Music comes from the public Deezer API (no key needed). Only 30-second
 * previews are available, which is also what makes this legal to stream.
 */
// Overridable so tests/dev can point at a local mock.
const API = process.env.DEEZER_API_URL ?? "https://api.deezer.com";

type DeezerTrack = {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist?: { name?: string };
  album?: { cover_medium?: string; cover_big?: string };
};

const isDeezerHost = (u: string) => /^https:\/\/[^/]*dzcdn\.net\//i.test(u);

function toTrack(t: DeezerTrack): TrackView | null {
  const cover = t.album?.cover_medium ?? "";
  if (!t.preview || !isDeezerHost(t.preview) || (cover && !isDeezerHost(cover))) return null;
  return {
    id: String(t.id),
    title: t.title,
    artist: t.artist?.name ?? "Unknown artist",
    cover,
    preview: t.preview,
    duration: t.duration,
  };
}

async function deezer<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.error) return null;
    return json as T;
  } catch {
    return null;
  }
}

export async function searchTracks(query: string, limit = 24): Promise<TrackView[] | null> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  const json = await deezer<{ data: DeezerTrack[] }>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`, 300);
  return json ? json.data.map(toTrack).filter((t): t is TrackView => !!t) : null;
}

export async function chartTracks(limit = 24): Promise<TrackView[] | null> {
  const json = await deezer<{ tracks: { data: DeezerTrack[] } }>(`/chart/0?limit=${limit}`, 3600);
  return json ? json.tracks.data.map(toTrack).filter((t): t is TrackView => !!t) : null;
}

/** Fresh track metadata + a currently valid preview URL (previews are signed and expire). */
export async function getTrack(id: string): Promise<TrackView | null> {
  const json = await deezer<DeezerTrack>(`/track/${encodeURIComponent(id)}`, 60);
  return json ? toTrack(json) : null;
}
