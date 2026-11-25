import { db } from "@/lib/db";
import { apiError, authed, json } from "@/lib/api";
import { captionSchema, deezerId } from "@/lib/validation";
import { extractHashtags } from "@/lib/format";
import { ImageError, processPostImage } from "@/lib/images";
import { deleteImages } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { getTrack } from "@/lib/data/music";

export const runtime = "nodejs";
const MAX_IMAGES = 10;

export async function POST(req: Request) {
  const { viewer, res } = await authed();
  if (res) return res;

  const limit = rateLimit(`post:${viewer.id}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return apiError("You're posting too much. Try again later.", 429);

  const form = await req.formData().catch(() => null);
  if (!form) return apiError("Invalid upload");

  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return apiError("Add at least one photo");
  if (files.length > MAX_IMAGES) return apiError(`You can add up to ${MAX_IMAGES} photos`);

  const caption = captionSchema.safeParse(String(form.get("caption") ?? ""));
  if (!caption.success) return apiError(caption.error.issues[0].message);

  // Attached music: trust Deezer, not the client, for the metadata.
  let music: { id: string; title: string; artist: string; cover: string } | null = null;
  const musicId = String(form.get("musicId") ?? "");
  if (musicId) {
    if (!deezerId.safeParse(musicId).success) return apiError("Invalid track");
    const track = await getTrack(musicId);
    if (!track) return apiError("Couldn't attach that track right now. Remove it or try again.");
    music = { id: track.id, title: track.title, artist: track.artist, cover: track.cover };
  }

  const stored = [];
  try {
    for (const file of files) stored.push(await processPostImage(file));
  } catch (e) {
    await deleteImages(stored.map((s) => s.key));
    if (e instanceof ImageError) return apiError(e.message);
    console.error("post image processing failed", e);
    return apiError("Couldn't process your photos", 500);
  }

  try {
    const tags = extractHashtags(caption.data);
    const post = await db.post.create({
      data: {
        authorId: viewer.id,
        caption: caption.data,
        musicId: music?.id,
        musicTitle: music?.title,
        musicArtist: music?.artist,
        musicCover: music?.cover,
        images: { create: stored.map((s, position) => ({ ...s, position })) },
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      select: { id: true },
    });
    return json({ id: post.id }, { status: 201 });
  } catch (e) {
    await deleteImages(stored.map((s) => s.key));
    console.error("post create failed", e);
    return apiError("Couldn't save your post", 500);
  }
}
