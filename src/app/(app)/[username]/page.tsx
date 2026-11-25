import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Camera, Grid3x3 } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { getProfile } from "@/lib/data/users";
import { getSavedGrid, getUserGrid } from "@/lib/data/posts";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PostGrid } from "@/components/post/post-grid";
import { cn } from "@/components/ui/cn";

type Props = { params: Promise<{ username: string }>; searchParams: Promise<{ tab?: string }> };

const decode = (v: string) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decode(username)}` };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const viewer = await requireViewer();
  const { username } = await params;
  const { tab } = await searchParams;
  const profile = await getProfile(decode(username), viewer.id);
  if (!profile) notFound();

  const saved = profile.isMe && tab === "saved";
  const grid = saved ? await getSavedGrid(viewer.id) : await getUserGrid(profile.id);
  const base = `/${profile.username}`;
  const tabClass = (active: boolean) =>
    cn("flex items-center gap-1.5 border-t py-3.5 text-xs font-semibold uppercase tracking-widest", active ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg");

  return (
    <div className="mx-auto max-w-[935px]">
      <ProfileHeader profile={profile} />

      <nav aria-label="Profile sections" className="mt-8 flex justify-center gap-12 border-t border-line">
        <Link href={base} aria-current={!saved ? "page" : undefined} className={tabClass(!saved)}>
          <Grid3x3 className="size-4" /> Posts
        </Link>
        {profile.isMe && (
          <Link href={`${base}?tab=saved`} aria-current={saved ? "page" : undefined} className={tabClass(saved)}>
            <Bookmark className="size-4" /> Saved
          </Link>
        )}
      </nav>

      <PostGrid
        key={saved ? "saved" : "posts"}
        endpoint={saved ? "/api/grid?kind=saved" : `/api/grid?kind=user&key=${profile.id}`}
        initial={grid}
        empty={
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full border-2 border-fg">
              {saved ? <Bookmark className="size-9" strokeWidth={1.5} /> : <Camera className="size-9" strokeWidth={1.5} />}
            </div>
            <h2 className="text-2xl font-bold">{saved ? "Nothing saved yet" : profile.isMe ? "Share your first photo" : "No posts yet"}</h2>
            <p className="mt-1 text-muted">
              {saved ? "Tap the bookmark on any post to keep it here, just for you." : profile.isMe ? "Tap + to post a photo — it will appear on your profile." : `When ${profile.username} shares photos, you'll see them here.`}
            </p>
          </div>
        }
      />
    </div>
  );
}
