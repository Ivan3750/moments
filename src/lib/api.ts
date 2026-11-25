import "server-only";
import { NextResponse } from "next/server";
import { getViewer, type Viewer } from "@/lib/auth";

export const json = <T,>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
export const apiError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Resolve the viewer for a route handler, or hand back the 401 response to return. */
export async function authed(): Promise<{ viewer: Viewer; res?: undefined } | { viewer?: undefined; res: NextResponse }> {
  const viewer = await getViewer();
  return viewer ? { viewer } : { res: apiError("Unauthorized", 401) };
}

export const cursorParam = (req: Request) => {
  const c = new URL(req.url).searchParams.get("cursor");
  return c && c.length <= 80 ? c : null;
};
