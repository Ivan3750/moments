"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { setLike, setSave } from "@/actions/posts";
import type { PostView } from "@/lib/types";

/** Optimistic like/save state for a post; rolls back (with a toast) if the server refuses. */
export function usePostState(post: Pick<PostView, "id" | "liked" | "likeCount" | "saved" | "commentCount">) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.saved);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [bump, setBump] = useState(0);
  const inflight = useRef(0);

  const like = useCallback(
    async (next: boolean) => {
      if (next === liked) return;
      const prev = { liked, likeCount };
      setLiked(next);
      setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
      if (next) setBump((n) => n + 1);
      inflight.current++;
      const res = await setLike(post.id, next);
      inflight.current--;
      if (!res.ok) {
        setLiked(prev.liked);
        setLikeCount(prev.likeCount);
        toast.error(res.error);
      } else if (inflight.current === 0) {
        setLikeCount(res.data.likeCount); // reconcile with other people's likes
      }
    },
    [liked, likeCount, post.id],
  );

  const save = useCallback(async () => {
    const next = !saved;
    setSaved(next);
    const res = await setSave(post.id, next);
    if (!res.ok) {
      setSaved(!next);
      toast.error(res.error);
    } else {
      toast(next ? "Saved to your collection" : "Removed from saved");
    }
  }, [saved, post.id]);

  return { liked, likeCount, saved, commentCount, setCommentCount, bump, like, save };
}

export async function sharePost(postId: string, caption: string) {
  const url = `${location.origin}/p/${postId}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Moments", text: caption.slice(0, 100), url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch (e) {
    if ((e as Error).name !== "AbortError") toast.error("Couldn't share this post");
  }
}
