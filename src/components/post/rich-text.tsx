import Link from "next/link";
import { RICH_TOKEN } from "@/lib/format";

/** Renders text with #hashtags and @mentions as links. No HTML is ever injected: React escapes everything. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(RICH_TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        if (part.startsWith("#")) {
          return (
            <Link key={i} href={`/tags/${encodeURIComponent(part.slice(1).toLowerCase())}`} className="text-accent hover:underline">
              {part}
            </Link>
          );
        }
        const username = part.slice(1).replace(/\.+$/, "");
        const rest = part.slice(1 + username.length);
        return (
          <span key={i}>
            <Link href={`/${username.toLowerCase()}`} className="text-accent hover:underline">
              @{username}
            </Link>
            {rest}
          </span>
        );
      })}
    </>
  );
}
