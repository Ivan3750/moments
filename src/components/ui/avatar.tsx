import Image from "next/image";
import { cn } from "@/components/ui/cn";

const GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-fuchsia-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-red-500",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  user,
  size = 32,
  className,
}: {
  user: { username: string; name?: string; avatar: string | null };
  size?: number;
  className?: string;
}) {
  const label = (user.name || user.username).trim();
  const initial = (label[0] ?? "?").toUpperCase();
  const style = { width: size, height: size };
  if (user.avatar) {
    return (
      <Image
        src={user.avatar}
        alt={`${user.username}'s profile photo`}
        width={size}
        height={size}
        unoptimized
        className={cn("shrink-0 rounded-full bg-subtle object-cover", className)}
        style={style}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={`${user.username}'s profile photo`}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white",
        GRADIENTS[hash(user.username) % GRADIENTS.length],
        className,
      )}
      style={{ ...style, fontSize: Math.max(11, size * 0.42) }}
    >
      {initial}
    </span>
  );
}
