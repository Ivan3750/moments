import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hash } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { countTag, getTagGrid } from "@/lib/data/posts";
import { PostGrid } from "@/components/post/post-grid";

type Props = { params: Promise<{ tag: string }> };

const parseTag = (raw: string) => {
  let tag = raw;
  try {
    tag = decodeURIComponent(raw);
  } catch {}
  return /^[\p{L}\p{N}_]{1,50}$/u.test(tag) ? tag.toLowerCase() : null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = parseTag((await params).tag);
  return { title: tag ? `#${tag}` : "Hashtag" };
}

export default async function TagPage({ params }: Props) {
  const viewer = await requireViewer();
  const tag = parseTag((await params).tag);
  if (!tag) notFound();
  const [initial, count] = await Promise.all([getTagGrid(tag), countTag(tag)]);
  void viewer;

  return (
    <div className="mx-auto max-w-[935px] px-3 pt-6 md:px-0 md:pt-10">
      <header className="mb-8 flex items-center gap-5">
        <span className="grid size-20 place-items-center rounded-full border border-line md:size-28">
          <Hash className="size-9 md:size-12" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">#{tag}</h1>
          <p className="text-muted">
            <span className="font-semibold text-fg">{count.toLocaleString("en-US")}</span> {count === 1 ? "post" : "posts"}
          </p>
        </div>
      </header>
      <PostGrid
        endpoint={`/api/grid?kind=tag&key=${encodeURIComponent(tag)}`}
        initial={initial}
        empty={<p className="py-20 text-center text-muted">No posts with #{tag} yet.</p>}
      />
    </div>
  );
}
