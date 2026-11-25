"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { destroySession, getViewer, createSession } from "@/lib/auth";
import { fail, isUniqueViolation, ok, type ActionResult } from "@/lib/action";
import { changePasswordSchema, cuid, fieldErrors, profileSchema, type FieldErrors } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { deleteImages } from "@/lib/storage";
import { notify, unnotify } from "@/lib/data/notifications";
import { rateLimit } from "@/lib/rate-limit";

/** Idempotent follow/unfollow: the client states the desired result. */
export async function setFollow(userId: string, follow: boolean): Promise<ActionResult<{ following: boolean; followerCount: number }>> {
  const viewer = await getViewer();
  if (!viewer) return fail("Please log in");
  if (!cuid.safeParse(userId).success) return fail("Invalid user");
  if (userId === viewer.id) return fail("You can't follow yourself");

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return fail("This account no longer exists");

  if (follow) {
    const created = await db.follow.createMany({ data: [{ followerId: viewer.id, followingId: userId }] }).catch(() => ({ count: 0 }));
    if (created.count > 0) await notify({ recipientId: userId, actorId: viewer.id, type: "follow" });
  } else {
    const removed = await db.follow.deleteMany({ where: { followerId: viewer.id, followingId: userId } });
    if (removed.count > 0) await unnotify({ recipientId: userId, actorId: viewer.id, type: "follow" });
  }
  return ok({ following: follow, followerCount: await db.follow.count({ where: { followingId: userId } }) });
}

export type SettingsState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  /** Echoed back because React resets uncontrolled form fields after every action. */
  values?: Record<string, string>;
} | null;

export async function updateProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const raw = {
    username: String(formData.get("username") ?? ""),
    name: String(formData.get("name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    website: String(formData.get("website") ?? ""),
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  try {
    await db.user.update({ where: { id: viewer.id }, data: parsed.data });
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: { username: ["This username is taken"] }, values: raw };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true, values: parsed.data };
}

export async function changePassword(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const limit = rateLimit(`pwd:${viewer.id}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return { error: "Too many attempts. Try again later." };

  const parsed = changePasswordSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("next") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const user = await db.user.findUnique({ where: { id: viewer.id } });
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { fieldErrors: { current: ["Current password is incorrect"] } };
  }
  const updated = await db.user.update({ where: { id: viewer.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  // Every other session becomes invalid (the cookie embeds a fingerprint of the old hash); keep this one.
  await createSession(updated);
  return { ok: true };
}

export async function deleteAccount(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const limit = rateLimit(`del:${viewer.id}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return { error: "Too many attempts. Try again later." };

  const user = await db.user.findUnique({
    where: { id: viewer.id },
    select: {
      passwordHash: true,
      avatarKey: true,
      posts: { select: { images: { select: { key: true } } } },
      stories: { select: { key: true } },
    },
  });
  if (!user || !(await verifyPassword(String(formData.get("password") ?? ""), user.passwordHash))) {
    return { fieldErrors: { password: ["Password is incorrect"] } };
  }

  await db.user.delete({ where: { id: viewer.id } }); // cascades to everything the user owns
  await deleteImages([user.avatarKey, ...user.posts.flatMap((p) => p.images.map((i) => i.key)), ...user.stories.map((s) => s.key)]);
  await destroySession();
  redirect("/login");
}
