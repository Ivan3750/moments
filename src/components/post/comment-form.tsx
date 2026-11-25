"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Smile } from "lucide-react";
import { addComment } from "@/actions/posts";
import { cn } from "@/components/ui/cn";
import type { CommentView } from "@/lib/types";

const EMOJI = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

export function CommentForm({ postId, onAdded, className }: { postId: string; onAdded: (c: CommentView) => void; className?: string }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [emoji, setEmoji] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || pending) return;
    start(async () => {
      const res = await addComment(postId, value);
      if (!res.ok) return void toast.error(res.error);
      setText("");
      setEmoji(false);
      onAdded(res.data);
    });
  }

  return (
    <form onSubmit={submit} className={cn("relative", className)}>
      {emoji && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
          {EMOJI.map((e) => (
            <button key={e} type="button" onClick={() => setText((t) => t + e)} className="grid size-8 place-items-center rounded-lg text-lg hover:bg-subtle">
              {e}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEmoji((v) => !v)} aria-label="Add emoji" aria-expanded={emoji} className="text-muted hover:text-fg">
          <Smile className="size-6" />
        </button>
        <input
          id={`comment-${postId}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Add a comment…"
          aria-label="Add a comment"
          autoComplete="off"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={!text.trim() || pending} className="text-sm font-semibold text-accent transition hover:opacity-70 disabled:opacity-40">
          Post
        </button>
      </div>
    </form>
  );
}
