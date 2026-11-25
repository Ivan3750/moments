"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { useUnread } from "@/components/shell/unread";
import { markConversationReadAction, sendMessage } from "@/actions/social";
import type { MessageView, UserLite } from "@/lib/types";

const POLL_MS = 3000;
const GAP_MS = 15 * 60 * 1000;

type Local = MessageView & { pending?: boolean; failed?: boolean };

export function Thread({ conversationId, other, initial }: { conversationId: string; other: UserLite; initial: MessageView[] }) {
  const [messages, setMessages] = useState<Local[]>(initial);
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const { refresh } = useUnread();
  const router = useRouter();
  const lastListRefresh = useRef(0);

  // Refresh the conversation list (preview text / ordering) at most every few seconds.
  const refreshList = useCallback(() => {
    if (Date.now() - lastListRefresh.current < 4000) return;
    lastListRefresh.current = Date.now();
    router.refresh();
  }, [router]);

  // Keep the view pinned to the newest message unless the user scrolled up to read history.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    void markConversationReadAction(conversationId).then(refresh);
  }, [conversationId, refresh]);

  const merge = useCallback((incoming: MessageView[]) => {
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, []);

  const latest = useRef<string | null>(initial.at(-1)?.createdAt ?? null);
  useEffect(() => {
    const last = messages.filter((m) => !m.pending).at(-1);
    if (last) latest.current = last.createdAt;
  }, [messages]);

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const after = latest.current ? `?after=${encodeURIComponent(latest.current)}` : "";
        const res = await fetch(`/api/messages/${conversationId}${after}`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const { messages: incoming } = (await res.json()) as { messages: MessageView[] };
        if (incoming.length) {
          merge(incoming);
          if (incoming.some((m) => !m.mine)) void refresh();
          refreshList();
        }
      } catch {
        /* transient network error: try again on the next tick */
      }
    };
    const id = setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [conversationId, merge, refresh, refreshList]);

  async function send(body: string, tempId = `tmp-${crypto.randomUUID()}`) {
    stick.current = true;
    setMessages((prev) => [...prev.filter((m) => m.id !== tempId), { id: tempId, text: body, createdAt: new Date().toISOString(), mine: true, pending: true }]);
    const res = await sendMessage(conversationId, body);
    if (!res.ok) {
      toast.error(res.error);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      return;
    }
    const real = res.data;
    refreshList();
    setMessages((prev) => (prev.some((m) => m.id === real.id) ? prev.filter((m) => m.id !== tempId) : prev.map((m) => (m.id === tempId ? real : m))));
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    void send(body);
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3 md:px-4">
        <Link href="/messages" aria-label="Back to messages" className="grid size-9 place-items-center rounded-full hover:bg-subtle md:hidden">
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/${other.username}`} className="flex min-w-0 items-center gap-3">
          <Avatar user={other} size={34} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{other.username}</p>
            {other.name && <p className="truncate text-xs text-muted">{other.name}</p>}
          </div>
        </Link>
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${other.username}`}
      >
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <Avatar user={other} size={80} className="mx-auto mb-3" />
              <p className="font-semibold">{other.username}</p>
              <p className="text-sm text-muted">Say hi 👋</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showTime = !prev || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > GAP_MS;
          const sameSender = prev && prev.mine === m.mine && !showTime;
          return (
            <div key={m.id}>
              {showTime && (
                <p suppressHydrationWarning className="py-3 text-center text-xs text-muted">
                  {new Date(m.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              )}
              <div className={cn("flex", m.mine ? "justify-end" : "justify-start", !sameSender && "mt-2")}>
                <div
                  title={new Date(m.createdAt).toLocaleString("en-US")}
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2 text-[15px] leading-snug",
                    m.mine ? "bg-accent text-accent-fg" : "bg-subtle",
                    m.pending && "opacity-60",
                    m.failed && "bg-like/20 text-fg ring-1 ring-like",
                  )}
                >
                  {m.text}
                </div>
              </div>
              {m.failed && (
                <button type="button" onClick={() => void send(m.text, m.id)} className="ml-auto mt-0.5 block text-xs font-semibold text-like">
                  Not sent · Tap to retry
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="flex shrink-0 items-end gap-2 border-t border-line p-3">
        <label className="sr-only" htmlFor="message-input">
          Message
        </label>
        <textarea
          id="message-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Message…"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-3xl border border-line bg-subtle px-4 py-2.5 text-[15px] outline-none focus:border-accent"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Send message" className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-fg transition disabled:opacity-40">
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </>
  );
}
