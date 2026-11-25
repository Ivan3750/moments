"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Counts = { notifications: number; messages: number };
const Ctx = createContext<Counts & { refresh: () => void }>({ notifications: 0, messages: 0, refresh: () => {} });

export const useUnread = () => useContext(Ctx);

/** Polls the unread badge counts while the tab is visible. */
export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Counts>({ notifications: 0, messages: 0 });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/unread", { cache: "no-store" });
      if (res.ok) setCounts(await res.json());
    } catch {
      /* offline: keep the last known counts */
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    tick();
    const id = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  const value = useMemo(() => ({ ...counts, refresh }), [counts, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
