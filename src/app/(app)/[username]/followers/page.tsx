import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { getFollowList, getProfile } from "@/lib/data/users";
import { UserList } from "@/components/profile/user-list";

export const metadata: Metadata = { title: "Followers" };

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const viewer = await requireViewer();
  const { username } = await params;
  const profile = await getProfile(decodeURIComponent(username), viewer.id);
  if (!profile) notFound();
  const initial = await getFollowList(profile.id, "followers", viewer.id);

  return (
    <div className="mx-auto max-w-lg md:pt-6">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Link href={`/${profile.username}`} aria-label="Back to profile" className="grid size-9 place-items-center rounded-full hover:bg-subtle">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-semibold">Followers</h1>
          <p className="text-xs text-muted">@{profile.username}</p>
        </div>
      </header>
      <UserList
        endpoint={`/api/follows?userId=${profile.id}&kind=followers`}
        initial={initial}
        emptyText="No followers yet."
      />
    </div>
  );
}
