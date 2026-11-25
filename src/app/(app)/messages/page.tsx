import type { Metadata } from "next";
import { Send } from "lucide-react";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesIndex() {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-24 place-items-center rounded-full border-2 border-fg">
          <Send className="size-10" strokeWidth={1.4} />
        </div>
        <h2 className="text-xl font-semibold">Your messages</h2>
        <p className="mt-1 max-w-xs text-muted">Send a private message to a friend. Use the pencil icon, or the Message button on a profile.</p>
      </div>
    </div>
  );
}
