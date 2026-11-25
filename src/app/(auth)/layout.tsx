import Image from "next/image";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { Logo } from "@/components/logo";

const TILES = [
  "from-indigo-500 to-violet-600",
  "from-sky-400 to-indigo-500",
  "from-fuchsia-500 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-violet-500 to-fuchsia-500",
  "from-rose-400 to-amber-400",
  "from-cyan-400 to-sky-600",
  "from-indigo-400 to-sky-500",
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getViewer()) redirect("/");
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-subtle lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo />
        <div>
          <div className="mb-10 grid max-w-md grid-cols-3 gap-3" aria-hidden>
            {TILES.map((t, i) => (
              <div
                key={i}
                className={`aspect-square rounded-2xl bg-gradient-to-br ${t} shadow-lg ${i % 2 ? "translate-y-4" : ""}`}
              />
            ))}
          </div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Capture the little things.
            <br />
            <span className="text-accent">Share every moment.</span>
          </h1>
          <p className="mt-3 max-w-md text-muted">Photos, stories, music and messages — with the people who matter.</p>
        </div>
        <p className="text-sm text-muted">© {new Date().getFullYear()} Moments</p>
      </section>

      <section className="flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 lg:hidden">
          <Image src="/logo.png" alt="Moments" width={64} height={64} priority />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
