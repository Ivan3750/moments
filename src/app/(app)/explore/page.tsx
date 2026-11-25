import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { getExploreGrid } from "@/lib/data/posts";
import { PostGrid } from "@/components/post/post-grid";
import { SearchBox } from "@/components/search-box";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const viewer = await requireViewer();
  const initial = await getExploreGrid(viewer.id);

  return (
    <div className="px-3 pt-3 md:px-0 md:pt-8">
      <div className="mx-auto mb-5 max-w-xl">
        <SearchBox />
      </div>
      <PostGrid
        endpoint="/api/grid?kind=explore"
        initial={initial}
        empty={
          <div className="py-24 text-center">
            <Compass className="mx-auto mb-3 size-12 text-muted" strokeWidth={1.25} />
            <h1 className="text-xl font-semibold">Nothing to explore yet</h1>
            <p className="mt-1 text-muted">When other people share photos, they&apos;ll show up here.</p>
          </div>
        }
      />
    </div>
  );
}
