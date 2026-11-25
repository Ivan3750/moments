import { NextResponse } from "next/server";
import { isValidKey, readImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Keys are random UUIDs and files are never modified, so they can be cached forever.
export async function GET(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  if (!isValidKey(key)) return new NextResponse("Not found", { status: 404 });

  const etag = `"${key}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }
  const file = await readImage(key);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(file.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
