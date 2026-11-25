"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/ui/cn";

/** Native <dialog>: focus trap, Esc to close and inert background come for free. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      className={cn(
        "m-auto max-h-[92dvh] w-[min(92vw,56rem)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl",
        "backdrop:bg-black/60",
        className,
      )}
    >
      {open && (
        <>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            >
              <X className="size-4" />
            </button>
          )}
          {children}
        </>
      )}
    </dialog>
  );
}
