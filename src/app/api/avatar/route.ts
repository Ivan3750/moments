import { db } from "@/lib/db";
import { apiError, authed, json } from "@/lib/api";
import { ImageError, processAvatar } from "@/lib/images";
import { deleteImages, mediaUrl } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { viewer, res } = await authed();
  if (res) return res;
  if (!rateLimit(`avatar:${viewer.id}`, 20, 60 * 60 * 1000).ok) return apiError("Too many changes. Try again later.", 429);

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return apiError("Choose an image");

  try {
    const img = await processAvatar(file);
    await db.user.update({ where: { id: viewer.id }, data: { avatarKey: img.key } });
    await deleteImages([viewer.avatarKey]);
    return json({ avatar: mediaUrl(img.key) });
  } catch (e) {
    if (e instanceof ImageError) return apiError(e.message);
    console.error("avatar failed", e);
    return apiError("Couldn't update your photo", 500);
  }
}

export async function DELETE() {
  const { viewer, res } = await authed();
  if (res) return res;
  await db.user.update({ where: { id: viewer.id }, data: { avatarKey: null } });
  await deleteImages([viewer.avatarKey]);
  return json({ avatar: null });
}
