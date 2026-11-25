"use client";

import { ComposerProvider } from "@/components/composer";
import { PlayerProvider } from "@/components/music/player";
import { UnreadProvider } from "@/components/shell/unread";

export function ShellProviders({ children }: { children: React.ReactNode }) {
  return (
    <UnreadProvider>
      <PlayerProvider>
        <ComposerProvider>{children}</ComposerProvider>
      </PlayerProvider>
    </UnreadProvider>
  );
}
