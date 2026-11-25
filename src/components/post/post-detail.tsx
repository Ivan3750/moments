"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { MediaCarousel } from "@/components/post/media-carousel";
import { LikeCount, PostActionBar } from "@/components/post/post-actions";
import { CommentForm } from "@/components/post/comment-form";
import { PostMenu } from "@/components/post/post-menu";
import { RichText } from "@/components/post/rich-text";
import { MusicChip } from "@/components/post/post-card";
import { useInfinite } from "@/components/post/infinite";
import { usePostState } from "@/components/post/use-post-state";
import { deleteComment } from "@/actions/posts";
import { timeAgo } from "@/lib/format";
import type { CommentView, Page, PostView } from "@/lib/types";

export function PostDetail({ post, initialComments, viewerId }: { post: PostView; initialComments: Page<CommentView>; viewerId: string }) {
  const router = useRouter();
  const state = usePostState(post);
  const [caption, setCaption] = useState(post.caption);
  const { items: comments, setItems, hasMore, loading, loadMore } = useInfinite<CommentView>(`/api/posts/${post.id}/comments`, initialComments);
  const isOwner = post.author.id === viewerId;

  return (
    <article className="mx-auto grid max-w-[935px] border-line md:mt-6 md:grid-cols-[minmax(0,1fr)_340px] md:border lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="bg-black md:flex md:items-center">
        <div className="w-full">
          <MediaCarousel images={post.images} alt={`Photo by ${post.author.username}`} onDoubleTap={() => state.like(true)} priority sizes="(min-width: 768px) 600px, 100vw" />
        </div>
      </div>

      <div className="flex min-h-0 flex-col md:max-h-[min(80vh,720px)]">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Link href={`/${post.author.username}`}>
            <Avatar user={post.author} size={34} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/${post.author.username}`} className="block truncate text-sm font-semibold hover:opacity-70">
              {post.author.username}
            </Link>
            {post.music && <MusicChip music={post.music} />}
          </div>
          <PostMenu postId={post.id} caption={caption} isOwner={isOwner} onCaption={setCaption} onDeleted={() => router.replace(`/${post.author.username}`)} />
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {caption && (
            <div className="flex gap-3">
              <Link href={`/${post.author.username}`} className="shrink-0">
                <Avatar user={post.author} size={34} />
              </Link>
              <div className="min-w-0 text-sm">
                <p className="whitespace-pre-line break-words">
                  <Link href={`/${post.author.username}`} className="mr-1.5 font-semibold hover:opacity-70">
                    {post.author.username}
                  </Link>
                  <RichText text={caption} />
                </p>
                <time dateTime={post.createdAt} suppressHydrationWarning className="text-xs text-muted">
                  {timeAgo(post.createdAt)}
                </time>
              </div>
            </div>
          )}

          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              canDelete={c.author.id === viewerId || isOwner}
              onDeleted={() => {
                setItems((prev) => prev.filter((x) => x.id !== c.id));
                state.setCommentCount((n) => Math.max(0, n - 1));
              }}
            />
          ))}

          {hasMore && (
            <button type="button" onClick={loadMore} disabled={loading} className="mx-auto block text-sm font-semibold text-accent hover:underline disabled:opacity-50">
              {loading ? "Loading…" : "Load more comments"}
            </button>
          )}
          {comments.length === 0 && !caption && <p className="py-8 text-center text-sm text-muted">No comments yet. Start the conversation.</p>}
        </div>

        <div className="space-y-1 border-t border-line px-4 pb-3 pt-1">
          <PostActionBar postId={post.id} caption={caption} state={state} />
          <LikeCount count={state.likeCount} />
          <p className="pb-1 text-[11px] uppercase tracking-wide text-muted">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          <CommentForm
            postId={post.id}
            className="border-t border-line pt-2"
            onAdded={(c) => {
              setItems((prev) => [...prev, c]);
              state.setCommentCount((n) => n + 1);
            }}
          />
        </div>
      </div>
    </article>
  );
}

function CommentRow({ comment, canDelete, onDeleted }: { comment: CommentView; canDelete: boolean; onDeleted: () => void }) {
  const [pending, start] = useTransition();
  return (
    <div className="group flex gap-3">
      <Link href={`/${comment.author.username}`} className="shrink-0">
        <Avatar user={comment.author} size={34} />
      </Link>
      <div className="min-w-0 flex-1 text-sm">
        <p className="break-words">
          <Link href={`/${comment.author.username}`} className="mr-1.5 font-semibold hover:opacity-70">
            {comment.author.username}
          </Link>
          <RichText text={comment.text} />
        </p>
        <time dateTime={comment.createdAt} suppressHydrationWarning className="text-xs text-muted">
          {timeAgo(comment.createdAt)}
        </time>
      </div>
      {canDelete && (
        <button
          type="button"
          aria-label="Delete comment"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await deleteComment(comment.id);
              if (!res.ok) return void toast.error(res.error);
              onDeleted();
            })
          }
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted opacity-100 transition hover:text-like md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
