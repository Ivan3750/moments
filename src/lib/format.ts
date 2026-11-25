// One definition of what counts as a hashtag / mention, shared by indexing (below) and rendering (RichText),
// so what is clickable is always exactly what is searchable. Lookbehinds keep "a#b", "x.com/#frag",
// "&#39;" and "foo@example.com" from being treated as tags or mentions.
const TAG = String.raw`(?<![\p{L}\p{N}_&/])#[\p{L}\p{N}_]{1,50}`;
const MENTION = String.raw`(?<![\p{L}\p{N}_.])@[a-zA-Z0-9._]{3,30}`;

/** Splits text into plain parts (even indexes) and #tag / @mention tokens (odd indexes). */
export const RICH_TOKEN = new RegExp(`(${TAG}|${MENTION})`, "gu");

/** Unique, lower-cased hashtags in a caption: "Hi #Sun #sun #2day" -> ["sun", "2day"]. */
export function extractHashtags(text: string, max = 30): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(new RegExp(TAG, "gu"))) {
    found.add(m[0].slice(1).toLowerCase());
    if (found.size >= max) break;
  }
  return [...found];
}

/** Unique, lower-cased @mentions in a text. */
export function extractMentions(text: string, max = 20): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(new RegExp(MENTION, "gu"))) {
    found.add(m[0].slice(1).toLowerCase().replace(/\.+$/, ""));
    if (found.size >= max) break;
  }
  return [...found];
}

/** 1200 -> "1.2K", 3_400_000 -> "3.4M" */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const units: [number, string][] = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [value, suffix] of units) {
    if (n >= value) {
      const v = n / value;
      return `${v >= 10 ? Math.floor(v) : Math.floor(v * 10) / 10}${suffix}`.replace(".0", "");
    }
  }
  return String(n);
}

/** Short relative time: "now", "5m", "3h", "2d", "4w", then a date. */
export function timeAgo(input: string | Date, now = Date.now()): string {
  const t = typeof input === "string" ? new Date(input).getTime() : input.getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 45) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return new Date(t).toLocaleDateString("en", { month: "short", day: "numeric", year: new Date(t).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric" });
}

export function plural(n: number, one: string, many = `${one}s`) {
  return n === 1 ? one : many;
}
