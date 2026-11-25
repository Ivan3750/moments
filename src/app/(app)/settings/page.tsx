import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/storage";
import { AvatarUploader, DeleteAccount, PasswordForm, ProfileForm } from "@/components/settings/settings-forms";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await requireViewer();
  const user = await db.user.findUniqueOrThrow({
    where: { id: viewer.id },
    select: { username: true, name: true, bio: true, website: true, email: true, avatarKey: true },
  });

  const section = "rounded-2xl border border-line p-5 md:p-6";
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 pt-6 md:px-0 md:pt-10">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className={section} aria-labelledby="profile-h">
        <h2 id="profile-h" className="mb-4 text-lg font-semibold">
          Edit profile
        </h2>
        <div className="mb-5">
          <AvatarUploader username={user.username} avatar={mediaUrl(user.avatarKey)} />
        </div>
        <ProfileForm profile={{ ...user, avatar: mediaUrl(user.avatarKey) }} />
      </section>

      <section className={section} aria-labelledby="password-h">
        <h2 id="password-h" className="mb-4 text-lg font-semibold">
          Password
        </h2>
        <PasswordForm />
      </section>

      <section className={`${section} border-like/40`} aria-labelledby="danger-h">
        <h2 id="danger-h" className="mb-1 text-lg font-semibold text-like">
          Danger zone
        </h2>
        <p className="mb-4 text-sm text-muted">Deleting your account removes everything you&apos;ve shared.</p>
        <DeleteAccount />
      </section>
    </div>
  );
}
