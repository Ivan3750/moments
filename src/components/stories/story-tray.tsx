"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/components/ui/cn";
import { useComposer } from "@/components/composer";
import { deleteStory, markStoryViewed } from "@/actions/social";
import { timeAgo } from "@/lib/format";
import type { StoryGroup, UserLite } from "@/lib/types";

const STORY_MS = 5000;

export function StoryTray({ groups: initial, viewer }: { groups: StoryGroup[]; viewer: UserLite }) {
  const [groups, setGroups] = useState(initial);
  const [open, setOpen] = useState<number | null>(null);
  const composer = useComposer();

  // Server data changes after router.refresh() (e.g. a story was just posted): resync during render.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setGroups(initial);
  }

  const mine = groups.find((g) => g.user.id === viewer.id);
  const others = groups.filter((g) => g.user.id !== viewer.id);
  const ordered = mine ? [mine, ...others] : others;

  const markSeen = useCallback((userId: string, storyId: string) => {
    setGroups((gs) =>
      gs.map((g) => {
        if (g.user.id !== userId) return g;
        const stories = g.stories.map((s) => (s.id === storyId ? { ...s, seen: true } : s));
        return { ...g, stories, allSeen: stories.every((s) => s.seen) };
      }),
    );
  }, []);

  return (
    <>
      <section aria-label="Stories" className="no-scrollbar flex gap-4 overflow-x-auto px-3 py-3 md:px-0">
        <div className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => (mine ? setOpen(0) : composer.open("story"))}
              aria-label={mine ? "View your story" : "Add to your story"}
              className={cn("block rounded-full p-[3px]", mine ? (mine.allSeen ? "story-ring-seen" : "story-ring") : "bg-transparent")}
            >
              <span className="block rounded-full border-2 border-bg">
                <Avatar user={viewer} size={58} />
              </span>
            </button>
            <button
              type="button"
              onClick={() => composer.open("story")}
              aria-label="Add a story"
              className="absolute bottom-0 right-0 grid size-5 place-items-center rounded-full bg-accent text-accent-fg ring-2 ring-bg"
            >
              <Plus className="size-3.5" strokeWidth={3} />
            </button>
          </div>
          <span className="w-full truncate text-center text-xs">Your story</span>
        </div>

        {others.map((g) => {
          const index = ordered.indexOf(g);
          return (
            <button key={g.user.id} type="button" onClick={() => setOpen(index)} aria-label={`View ${g.user.username}'s story${g.allSeen ? "" : " (new)"}`} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
              <span className={cn("block rounded-full p-[3px]", g.allSeen ? "story-ring-seen" : "story-ring")}>
                <span className="block rounded-full border-2 border-bg">
                  <Avatar user={g.user} size={58} />
                </span>
              </span>
              <span className={cn("w-full truncate text-center text-xs", g.allSeen && "text-muted")}>{g.user.username}</span>
            </button>
          );
        })}
      </section>

      <Modal open={open !== null} onClose={() => setOpen(null)} title="Stories" hideClose className="h-[min(100dvh,52rem)] max-h-none w-[min(100vw,26rem)] rounded-none border-0 bg-black sm:rounded-2xl">
        {open !== null && (
          <StoryViewer
            groups={ordered}
            startGroup={open}
            viewerId={viewer.id}
            onSeen={markSeen}
            onClose={() => setOpen(null)}
            onDeleted={(userId, storyId) =>
              setGroups((gs) =>
                gs
                  .map((g) => (g.user.id === userId ? { ...g, stories: g.stories.filter((s) => s.id !== storyId) } : g))
                  .filter((g) => g.stories.length > 0),
              )
            }
          />
        )}
      </Modal>
    </>
  );
}

function StoryViewer({
  groups,
  startGroup,
  viewerId,
  onSeen,
  onClose,
  onDeleted,
}: {
  groups: StoryGroup[];
  startGroup: number;
  viewerId: string;
  onSeen: (userId: string, storyId: string) => void;
  onClose: () => void;
  onDeleted: (userId: string, storyId: string) => void;
}) {
  const [g, setG] = useState(startGroup);
  const [s, setS] = useState(() => {
    const first = groups[startGroup]?.stories.findIndex((x) => !x.seen) ?? 0;
    return first === -1 ? 0 : first;
  });
  const [paused, setPaused] = useState(false);
  const [broken, setBroken] = useState(false);
  const group = groups[g];
  const story = group?.stories[s];
  const reported = useRef<string | null>(null);

  const next = useCallback(() => {
    const cur = groups[g];
    if (s < cur.stories.length - 1) setS(s + 1);
    else if (g < groups.length - 1) {
      setG(g + 1);
      setS(0);
    }
    else onClose();
    setBroken(false);
  }, [g, s, groups, onClose]);

  const prev = useCallback(() => {
    if (s > 0) setS(s - 1);
    else if (g > 0) {
      setG(g - 1);
      setS(groups[g - 1].stories.length - 1);
    }
    setBroken(false);
  }, [g, s, groups]);

  const goGroup = (index: number) => {
    setG(index);
    setS(0);
    setBroken(false);
  };

  // Mark as seen once per story.
  useEffect(() => {
    if (!story || reported.current === story.id) return;
    reported.current = story.id;
    onSeen(group.user.id, story.id);
    void markStoryViewed(story.id);
  }, [story, group, onSeen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // The group can vanish if its last story was deleted.
  useEffect(() => {
    if (!story) onClose();
  }, [story, onClose]);
  if (!story) return null;

  const isMine = group.user.id === viewerId;

  return (
    <div className="relative flex h-full select-none flex-col text-white">
      <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-3">
        <div className="flex gap-1" aria-hidden>
          {group.stories.map((st, i) => (
            <div key={st.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
              <div
                key={i === s ? story.id : undefined}
                className="h-full origin-left bg-white"
                style={
                  i < s
                    ? { transform: "scaleX(1)" }
                    : i === s
                      ? { animation: `story-progress ${STORY_MS}ms linear forwards`, animationPlayState: paused || broken ? "paused" : "running" }
                      : { transform: "scaleX(0)" }
                }
                onAnimationEnd={i === s ? next : undefined}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Link href={`/${group.user.username}`} className="flex min-w-0 flex-1 items-center gap-2" onClick={onClose}>
            <Avatar user={group.user} size={32} />
            <span className="truncate text-sm font-semibold">{group.user.username}</span>
            <time dateTime={story.createdAt} suppressHydrationWarning className="text-sm text-white/70">
              {timeAgo(story.createdAt)}
            </time>
          </Link>
          {isMine && (
            <button
              type="button"
              aria-label="Delete story"
              onClick={async () => {
                setPaused(true);
                const res = await deleteStory(story.id);
                setPaused(false);
                if (!res.ok) return void toast.error(res.error);
                onDeleted(group.user.id, story.id);
                toast.success("Story deleted");
                setS((i) => Math.max(0, Math.min(i, group.stories.length - 2)));
              }}
              className="grid size-9 place-items-center rounded-full hover:bg-white/15"
            >
              <Trash2 className="size-5" />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close stories" className="grid size-9 place-items-center rounded-full hover:bg-white/15">
            <X className="size-6" />
          </button>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <Image
          key={story.id}
          src={story.url}
          alt={`Story by ${group.user.username}`}
          fill
          unoptimized
          priority
          sizes="420px"
          className="object-contain"
          onError={() => setBroken(true)}
        />
        {broken && <p className="absolute inset-0 grid place-items-center text-sm text-white/70">This story couldn&apos;t be loaded</p>}
        <button type="button" aria-label="Previous story" onClick={prev} className="absolute inset-y-0 left-0 w-1/3" />
        <button type="button" aria-label="Next story" onClick={next} className="absolute inset-y-0 right-0 w-2/3" />
        {g > 0 && (
          <button type="button" aria-label="Previous person" onClick={() => goGroup(g - 1)} className="absolute left-2 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-white/20 sm:grid">
            <ChevronLeft className="size-5" />
          </button>
        )}
        {g < groups.length - 1 && (
          <button type="button" aria-label="Next person" onClick={() => goGroup(g + 1)} className="absolute right-2 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-white/20 sm:grid">
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
