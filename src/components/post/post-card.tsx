"use client";

import { useState } from "react";
import Link from "next/link";
import { Music2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MediaCarousel } from "@/components/post/media-carousel";
import { LikeCount, PostActionBar } from "@/components/post/post-actions";
import { CommentForm } from "@/components/post/comment-form";
import { PostMenu } from "@/components/post/post-menu";
import { RichText } from "@/components/post/rich-text";
import { usePostState } from "@/components/post/use-post-state";
import { Equalizer, usePlayer } from "@/components/music/player";
import { timeAgo } from "@/lib/format";
import type { CommentView, PostView } from "@/lib/types";

export function MusicChip({ music }: { music: NonNullable<PostView["music"]> }) {
  const player = usePlayer();
  const active = player.current?.id === music.id;
  const playing = active && player.playing;
  return (
    <button
      type="button"
      onClick={() => player.toggle(music)}
      aria-label={`${playing ? "Pause" : "Play"} ${music.title} by ${music.artist}`}
      className="flex max-w-full items-center gap-1.5 text-xs text-muted hover:text-fg"
    >
      {playing ? <Equalizer active /> : <Music2 className="size-3.5 shrink-0" />}
      <span className="truncate">
        {music.title} · {music.artist}
      </span>
    </button>
  );
}

export function PostCard({ post, viewerId, priority }: { post: PostView; viewerId: string; priority?: boolean }) {
  const state = usePostState(post);
  const [caption, setCaption] = useState(post.caption);
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<CommentView[]>(post.preview);
  const [deleted, setDeleted] = useState(false);
  const long = caption.length > 140 || caption.split("\n").length > 2;

  if (deleted) return null;

  return (
    <article className="border-b border-line pb-3 md:pb-5" aria-label={`Post by ${post.author.username}`}>
      <header className="flex items-center gap-3 px-3 py-2.5 md:px-0">
        <Link href={`/${post.author.username}`} aria-label={`${post.author.username}'s profile`}>
          <Avatar user={post.author} size={36} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm">
            <Link href={`/${post.author.username}`} className="truncate font-semibold hover:opacity-70">
              {post.author.username}
            </Link>
            <span className="text-muted" aria-hidden>
              •
            </span>
            <time dateTime={post.createdAt} suppressHydrationWarning className="text-muted">
              {timeAgo(post.createdAt)}
            </time>
          </p>
          {post.music && <MusicChip music={post.music} />}
        </div>
        <PostMenu postId={post.id} caption={caption} isOwner={post.author.id === viewerId} onCaption={setCaption} onDeleted={() => setDeleted(true)} />
      </header>

      <div className="md:overflow-hidden md:rounded-sm md:border md:border-line">
        <MediaCarousel images={post.images} alt={`Photo by ${post.author.username}`} onDoubleTap={() => state.like(true)} priority={priority} />
      </div>

      <div className="px-3 pt-1 md:px-0">
        <PostActionBar postId={post.id} caption={caption} state={state} commentHref={`/p/${post.id}`} />
        <LikeCount count={state.likeCount} />

        {caption && (
          <p className={`mt-1 whitespace-pre-line break-words text-sm ${long && !expanded ? "line-clamp-2" : ""}`}>
            <Link href={`/${post.author.username}`} className="mr-1.5 font-semibold hover:opacity-70">
              {post.author.username}
            </Link>
            <RichText text={caption} />
          </p>
        )}
        {long && !expanded && (
          <button type="button" onClick={() => setExpanded(true)} className="text-sm text-muted">
            more
          </button>
        )}

        {state.commentCount > 2 && (
          <Link href={`/p/${post.id}`} className="mt-1 block text-sm text-muted hover:underline">
            View all {state.commentCount.toLocaleString("en-US")} comments
          </Link>
        )}
        {preview.map((c) => (
          <p key={c.id} className="mt-0.5 break-words text-sm">
            <Link href={`/${c.author.username}`} className="mr-1.5 font-semibold hover:opacity-70">
              {c.author.username}
            </Link>
            <RichText text={c.text} />
          </p>
        ))}

        <CommentForm
          postId={post.id}
          className="mt-2"
          onAdded={(c) => {
            setPreview((p) => [...p, c].slice(-2));
            state.setCommentCount((n) => n + 1);
          }}
        />
      </div>
    </article>
  );
}
