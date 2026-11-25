import { db } from "@/lib/db";
import { apiError, authed, json } from "@/lib/api";
import { ImageError, processStoryImage } from "@/lib/images";
import { deleteImages } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { STORY_TTL_MS } from "@/lib/data/stories";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { viewer, res } = await authed();
  if (res) return res;
  if (!rateLimit(`story:${viewer.id}`, 30, 60 * 60 * 1000).ok) return apiError("Too many stories. Try again later.", 429);

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return apiError("Choose an image");

  try {
    const img = await processStoryImage(file);
    try {
      const story = await db.story.create({
        data: { authorId: viewer.id, key: img.key, width: img.width, height: img.height, expiresAt: new Date(Date.now() + STORY_TTL_MS) },
        select: { id: true },
      });
      return json({ id: story.id }, { status: 201 });
    } catch (e) {
      await deleteImages([img.key]);
      throw e;
    }
  } catch (e) {
    if (e instanceof ImageError) return apiError(e.message);
    console.error("story failed", e);
    return apiError("Couldn't publish your story", 500);
  }
}
