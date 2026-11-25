"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button, Spinner } from "@/components/ui/button";
import { deletePost, updateCaption } from "@/actions/posts";

export function PostMenu({
  postId,
  caption,
  isOwner,
  onCaption,
  onDeleted,
}: {
  postId: string;
  caption: string;
  isOwner: boolean;
  onCaption?: (c: string) => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [draft, setDraft] = useState(caption);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block w-full px-4 py-3 text-left text-sm hover:bg-subtle";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="More options" aria-haspopup="menu" aria-expanded={open} className="grid size-9 place-items-center rounded-full hover:bg-subtle">
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
          <button
            role="menuitem"
            className={item}
            onClick={async () => {
              setOpen(false);
              try {
                await navigator.clipboard.writeText(`${location.origin}/p/${postId}`);
                toast.success("Link copied");
              } catch {
                toast.error("Couldn't copy the link");
              }
            }}
          >
            Copy link
          </button>
          <button role="menuitem" className={item} onClick={() => {
              setOpen(false);
              router.push(`/p/${postId}`);
            }}>
            Go to post
          </button>
          {isOwner && (
            <>
              <button role="menuitem" className={item} onClick={() => {
                  setOpen(false);
                  setDraft(caption);
                  setDialog("edit");
                }}>
                Edit caption
              </button>
              <button role="menuitem" className={`${item} font-semibold text-like`} onClick={() => {
                  setOpen(false);
                  setDialog("delete");
                }}>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      <Modal open={dialog === "delete"} onClose={() => setDialog(null)} title="Delete post" className="w-[min(92vw,24rem)]" hideClose>
        <div className="p-6 text-center">
          <h2 className="text-lg font-semibold">Delete this post?</h2>
          <p className="mt-1 text-sm text-muted">This permanently removes the photos, likes and comments.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await deletePost(postId);
                  if (!res.ok) return void toast.error(res.error);
                  setDialog(null);
                  toast.success("Post deleted");
                  onDeleted?.();
                  router.refresh();
                })
              }
            >
              {pending && <Spinner />} Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={dialog === "edit"} onClose={() => setDialog(null)} title="Edit caption" className="w-[min(92vw,30rem)]" hideClose>
        <form
          className="p-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await updateCaption(postId, draft);
              if (!res.ok) return void toast.error(res.error);
              onCaption?.(res.data.caption);
              setDialog(null);
              toast.success("Caption updated");
            });
          }}
        >
          <h2 className="mb-3 text-lg font-semibold">Edit caption</h2>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2200}
            rows={6}
            autoFocus
            aria-label="Caption"
            className="w-full resize-none rounded-xl border border-line bg-subtle p-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />} Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
