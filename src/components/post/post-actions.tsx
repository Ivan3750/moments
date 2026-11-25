"use client";

import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { sharePost, type usePostState } from "@/components/post/use-post-state";

type State = ReturnType<typeof usePostState>;

export function PostActionBar({ postId, caption, state, commentHref }: { postId: string; caption: string; state: State; commentHref?: string }) {
  const iconBtn = "grid size-10 place-items-center rounded-full transition hover:opacity-60 active:scale-90";
  return (
    <div className="-mx-2 flex items-center">
      <button type="button" onClick={() => state.like(!state.liked)} aria-label={state.liked ? "Unlike" : "Like"} aria-pressed={state.liked} className={iconBtn}>
        <Heart key={state.bump} className={cn("size-[26px]", state.liked && "animate-like-bump fill-like text-like")} />
      </button>
      {commentHref ? (
        <Link href={commentHref} aria-label="Comments" className={iconBtn}>
          <MessageCircle className="size-[26px]" />
        </Link>
      ) : (
        <button type="button" onClick={() => document.getElementById(`comment-${postId}`)?.focus()} aria-label="Comment" className={iconBtn}>
          <MessageCircle className="size-[26px]" />
        </button>
      )}
      <button type="button" onClick={() => sharePost(postId, caption)} aria-label="Share" className={iconBtn}>
        <Send className="size-[25px]" />
      </button>
      <button type="button" onClick={state.save} aria-label={state.saved ? "Remove from saved" : "Save"} aria-pressed={state.saved} className={cn(iconBtn, "ml-auto")}>
        <Bookmark className={cn("size-[26px]", state.saved && "fill-current")} />
      </button>
    </div>
  );
}

export function LikeCount({ count }: { count: number }) {
  if (count === 0) return <p className="text-sm text-muted">Be the first to like this</p>;
  return (
    <p className="text-sm font-semibold">
      {count.toLocaleString("en-US")} {count === 1 ? "like" : "likes"}
    </p>
  );
}
