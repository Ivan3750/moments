import Image from "next/image";
import Link from "next/link";
import { cn } from "@/components/ui/cn";

/** `text="lg"` shows the wordmark only from the lg breakpoint up (used by the collapsing sidebar). */
export function Logo({ className, text = true, href = "/" }: { className?: string; text?: boolean | "lg"; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)} aria-label="Moments home">
      <Image src="/logo.png" alt="" width={36} height={36} priority className="size-9" />
      {text && <span className={cn("text-2xl font-extrabold tracking-tight", text === "lg" && "hidden lg:inline")}>Moments</span>}
    </Link>
  );
}
