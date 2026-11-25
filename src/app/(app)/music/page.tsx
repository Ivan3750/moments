import type { Metadata } from "next";
import { Music2 } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { TrackBrowser } from "@/components/music/track-browser";

export const metadata: Metadata = { title: "Music" };

export default async function MusicPage() {
  await requireViewer();
  return (
    <div className="mx-auto max-w-xl px-4 pt-6 md:px-0 md:pt-10">
      <header className="mb-5 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-fg">
          <Music2 className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Music</h1>
          <p className="text-sm text-muted">Preview any track — then add it to your next post.</p>
        </div>
      </header>
      <TrackBrowser />
      <p className="mt-6 text-center text-xs text-muted">30-second previews provided by Deezer.</p>
    </div>
  );
}
