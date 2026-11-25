import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { getComments, getPost } from "@/lib/data/posts";
import { PostDetail } from "@/components/post/post-detail";
import { cuid } from "@/lib/validation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const viewer = await requireViewer();
  const post = cuid.safeParse(id).success ? await getPost(id, viewer.id) : null;
  if (!post) return { title: "Post not found" };
  const snippet = post.caption.replace(/\s+/g, " ").slice(0, 80);
  return { title: `${post.author.username} on Moments${snippet ? `: “${snippet}”` : ""}` };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const viewer = await requireViewer();
  if (!cuid.safeParse(id).success) notFound();
  const [post, comments] = await Promise.all([getPost(id, viewer.id), getComments(id)]);
  if (!post) notFound();
  return <PostDetail post={post} initialComments={comments} viewerId={viewer.id} />;
}
