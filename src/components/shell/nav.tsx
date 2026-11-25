"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Compass, Home, LogOut, Menu, Monitor, Moon, Music2, PlusSquare, Send, Settings, Sun } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { useComposer } from "@/components/composer";
import { useUnread } from "@/components/shell/unread";
import { logout } from "@/actions/auth";

export type NavViewer = { username: string; name: string; avatar: string | null };

function Badge({ count, className = "-right-1.5 -top-1.5" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={cn("absolute", className, "grid h-[18px] min-w-[18px] place-items-center rounded-full bg-like px-1 text-[11px] font-bold leading-none text-white ring-2 ring-bg")}>
      {count > 9 ? "9+" : count}
    </span>
  );
}

const itemBase = "group relative flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-subtle";

export function Sidebar({ viewer }: { viewer: NavViewer }) {
  const pathname = usePathname();
  const unread = useUnread();
  const composer = useComposer();

  const links = [
    { href: "/", label: "Home", Icon: Home, badge: 0 },
    { href: "/explore", label: "Explore", Icon: Compass, badge: 0 },
    { href: "/music", label: "Music", Icon: Music2, badge: 0 },
    { href: "/messages", label: "Messages", Icon: Send, badge: unread.messages },
    { href: "/notifications", label: "Notifications", Icon: Bell, badge: unread.notifications },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const profileHref = `/${viewer.username}`;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-line bg-bg px-3 py-5 md:flex lg:w-[244px]">
      <Logo className="mb-6 px-2" text="lg" />
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, Icon, badge }) => (
          <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={cn(itemBase, "justify-center lg:justify-start")}>
            <span className="relative">
              <Icon className={cn("size-6 transition-transform group-hover:scale-105", isActive(href) && "stroke-[2.6]")} />
              <Badge count={badge} />
            </span>
            <span className={cn("hidden text-[15px] lg:block", isActive(href) && "font-bold")}>{label}</span>
          </Link>
        ))}
        <button type="button" onClick={() => composer.open("post")} className={cn(itemBase, "justify-center lg:justify-start")}>
          <PlusSquare className="size-6 transition-transform group-hover:scale-105" />
          <span className="hidden text-[15px] lg:block">Create</span>
        </button>
        <Link href={profileHref} aria-current={pathname === profileHref ? "page" : undefined} className={cn(itemBase, "justify-center lg:justify-start")}>
          <Avatar user={viewer} size={26} className={cn(pathname === profileHref && "ring-2 ring-fg ring-offset-2 ring-offset-bg")} />
          <span className={cn("hidden text-[15px] lg:block", pathname === profileHref && "font-bold")}>Profile</span>
        </Link>
      </nav>
      <MoreMenu />
    </aside>
  );
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  // `theme` is only known on the client; avoid a hydration mismatch for the pressed state.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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

  const themes = [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "system", label: "System", Icon: Monitor },
  ] as const;

  return (
    <div ref={ref} className="relative">
      {open && (
        <div role="menu" className="absolute bottom-full left-0 mb-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-subtle">
            <Settings className="size-5" /> Settings
          </Link>
          <div className="flex items-center gap-1 px-2 py-2" role="group" aria-label="Theme">
            {themes.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                aria-pressed={mounted && theme === id}
                className={cn("flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs", mounted && theme === id ? "bg-subtle font-semibold" : "text-muted hover:bg-subtle")}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <div className="my-1 h-px bg-line" />
          <form action={logout}>
            <button role="menuitem" type="submit" className="flex w-full items-center gap-3 rounded-lg p-3 text-sm hover:bg-subtle">
              <LogOut className="size-5" /> Log out
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(itemBase, "w-full justify-center lg:justify-start", open && "bg-subtle")}
      >
        <Menu className="size-6" />
        <span className="hidden text-[15px] lg:block">More</span>
      </button>
    </div>
  );
}

export function MobileTopBar() {
  const unread = useUnread();
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur md:hidden">
      <Logo />
      <div className="flex items-center gap-1">
        <Link href="/notifications" aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full hover:bg-subtle">
          <Bell className="size-6" />
          <Badge count={unread.notifications} className="right-0.5 top-0.5" />
        </Link>
        <Link href="/messages" aria-label="Messages" className="relative grid size-10 place-items-center rounded-full hover:bg-subtle">
          <Send className="size-6" />
          <Badge count={unread.messages} className="right-0.5 top-0.5" />
        </Link>
      </div>
    </header>
  );
}

export function MobileNav({ viewer }: { viewer: NavViewer }) {
  const pathname = usePathname();
  const composer = useComposer();
  const profileHref = `/${viewer.username}`;
  const tab = "grid h-full flex-1 place-items-center";

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" style={{ boxSizing: "content-box" }}>
      <Link href="/" aria-label="Home" aria-current={pathname === "/" ? "page" : undefined} className={tab}>
        <Home className={cn("size-6", pathname === "/" && "stroke-[2.6]")} />
      </Link>
      <Link href="/explore" aria-label="Explore" aria-current={pathname.startsWith("/explore") ? "page" : undefined} className={tab}>
        <Compass className={cn("size-6", pathname.startsWith("/explore") && "stroke-[2.6]")} />
      </Link>
      <button type="button" aria-label="Create" onClick={() => composer.open("post")} className={tab}>
        <PlusSquare className="size-6" />
      </button>
      <Link href="/music" aria-label="Music" aria-current={pathname.startsWith("/music") ? "page" : undefined} className={tab}>
        <Music2 className={cn("size-6", pathname.startsWith("/music") && "stroke-[2.6]")} />
      </Link>
      <Link href={profileHref} aria-label="Profile" aria-current={pathname === profileHref ? "page" : undefined} className={tab}>
        <Avatar user={viewer} size={26} className={cn(pathname === profileHref && "ring-2 ring-fg ring-offset-2 ring-offset-bg")} />
      </Link>
    </nav>
  );
}
