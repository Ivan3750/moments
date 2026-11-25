"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { Search, SquarePen } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { Modal } from "@/components/ui/modal";
import { openConversation } from "@/actions/social";
import { timeAgo } from "@/lib/format";
import type { ConversationView, UserLite } from "@/lib/types";

/** Two panes on desktop; on mobile either the list or the open thread. */
export function MessagesShell({ conversations, children }: { conversations: ConversationView[]; children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const router = useRouter();
  const [newChat, setNewChat] = useState(false);

  // Keep the list fresh (new messages / unread dots) while the tab is open.
  useEffect(() => {
    const id = setInterval(() => document.visibilityState === "visible" && router.refresh(), 15_000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex h-[calc(100dvh-3rem-3.5rem)] md:h-dvh md:border-x md:border-line">
      <aside className={cn("w-full shrink-0 flex-col border-r border-line md:flex md:w-[340px]", segment ? "hidden" : "flex")}>
        <header className="flex h-14 items-center justify-between border-b border-line px-4">
          <h1 className="text-lg font-bold">Messages</h1>
          <button type="button" onClick={() => setNewChat(true)} aria-label="New message" className="grid size-9 place-items-center rounded-full hover:bg-subtle">
            <SquarePen className="size-5" />
          </button>
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {conversations.length === 0 && <li className="px-6 py-16 text-center text-sm text-muted">No conversations yet.<br />Tap the pencil to start one.</li>}
          {conversations.map((c) => {
            const active = segment === c.id;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 px-4 py-3 hover:bg-subtle", active && "bg-subtle")}>
                  <Avatar user={c.other} size={52} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", c.unread && !active ? "font-bold" : "font-medium")}>{c.other.username}</p>
                    <p className={cn("truncate text-sm", c.unread && !active ? "font-semibold text-fg" : "text-muted")}>
                      {c.lastMessage ? `${c.lastMessage.mine ? "You: " : ""}${c.lastMessage.text}` : ""}
                      {c.lastMessage && (
                        <>
                          {" · "}
                          <time suppressHydrationWarning dateTime={c.lastMessageAt}>{timeAgo(c.lastMessageAt)}</time>
                        </>
                      )}
                    </p>
                  </div>
                  {c.unread && !active && <span aria-label="Unread" className="size-2.5 shrink-0 rounded-full bg-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className={cn("min-w-0 flex-1 flex-col", segment ? "flex" : "hidden md:flex")}>{children}</section>

      <Modal open={newChat} onClose={() => setNewChat(false)} title="New message" className="w-[min(92vw,26rem)]" hideClose>
        <NewChat onClose={() => setNewChat(false)} />
      </Modal>
    </div>
  );
}

function NewChat({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (res.ok) setUsers((await res.json()).users);
      } catch {}
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-semibold">New message</h2>
        <button type="button" onClick={onClose} className="text-sm text-muted hover:text-fg">
          Cancel
        </button>
      </div>
      <label className="flex items-center gap-2 border-b border-line px-4">
        <Search className="size-4 text-muted" />
        <span className="sr-only">Search people</span>
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="h-12 flex-1 bg-transparent text-sm outline-none" />
      </label>
      <ul className="max-h-72 overflow-y-auto p-1.5">
        {q.trim() && users.length === 0 && <li className="p-6 text-center text-sm text-muted">No people found.</li>}
        {(q.trim() ? users : []).map((u) => (
          <li key={u.id}>
            <form action={openConversation.bind(null, u.id)}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-subtle">
                <Avatar user={u} size={44} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{u.username}</span>
                  {u.name && <span className="block truncate text-sm text-muted">{u.name}</span>}
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
