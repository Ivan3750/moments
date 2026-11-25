import { requireViewer } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";
import { ShellProviders } from "@/components/shell/providers";
import { MobileNav, MobileTopBar, Sidebar } from "@/components/shell/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const nav = { username: viewer.username, name: viewer.name, avatar: mediaUrl(viewer.avatarKey) };

  return (
    <ShellProviders>
      <Sidebar viewer={nav} />
      <MobileTopBar />
      <div className="md:pl-[72px] lg:pl-[244px]">
        <main className="mx-auto min-h-dvh w-full max-w-[1000px] px-0 pb-24 md:px-6 md:pb-10">{children}</main>
      </div>
      <MobileNav viewer={nav} />
    </ShellProviders>
  );
}
