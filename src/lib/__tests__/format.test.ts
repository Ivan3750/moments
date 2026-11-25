import { describe, expect, it } from "vitest";
import { RICH_TOKEN, extractHashtags, extractMentions, formatCount, plural, timeAgo } from "@/lib/format";

describe("extractHashtags", () => {
  it("finds unique lower-cased tags", () => {
    expect(extractHashtags("Hi #Sun #sun #2day!")).toEqual(["sun", "2day"]);
  });
  it("supports non-latin letters", () => {
    expect(extractHashtags("Привіт #сонце #日本")).toEqual(["сонце", "日本"]);
  });
  it("ignores hashes inside words, urls and html entities", () => {
    expect(extractHashtags("a#b http://x.com/#frag &#39; #ok")).toEqual(["ok"]);
  });
  it("caps the number of tags", () => {
    const text = Array.from({ length: 50 }, (_, i) => `#t${i}`).join(" ");
    expect(extractHashtags(text)).toHaveLength(30);
  });
  it("returns nothing for plain text", () => {
    expect(extractHashtags("no tags here")).toEqual([]);
  });
});

describe("rendering and indexing agree", () => {
  it.each(["Hi #Sun and @Bob_1!", "a#b http://x.com/#frag &#39; #ok", "mail foo@example.com #x", "#a#b #c_d @ab @abc.def."])(
    "%j",
    (text) => {
      const rendered = text.split(RICH_TOKEN).filter((_, i) => i % 2 === 1);
      expect(rendered.filter((t) => t.startsWith("#")).map((t) => t.slice(1).toLowerCase())).toEqual(extractHashtags(text));
      expect(rendered.filter((t) => t.startsWith("@")).map((t) => t.slice(1).toLowerCase().replace(/\.+$/, ""))).toEqual(extractMentions(text));
    },
  );
});

describe("extractMentions", () => {
  it("finds mentions and drops trailing dots", () => {
    expect(extractMentions("hey @Alice. and @bob_1!")).toEqual(["alice", "bob_1"]);
  });
  it("ignores emails", () => {
    expect(extractMentions("mail me at foo@example.com")).toEqual([]);
  });
});

describe("formatCount", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1K"],
    [1250, "1.2K"],
    [10_500, "10K"],
    [1_000_000, "1M"],
    [3_400_000, "3.4M"],
    [2_100_000_000, "2.1B"],
  ])("%i -> %s", (n, expected) => expect(formatCount(n)).toBe(expected));
});

describe("timeAgo", () => {
  const now = new Date("2026-06-15T12:00:00Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();
  it.each([
    [10_000, "now"],
    [5 * 60_000, "5m"],
    [3 * 3600_000, "3h"],
    [2 * 86400_000, "2d"],
    [14 * 86400_000, "2w"],
  ])("%i ms ago -> %s", (ms, expected) => expect(timeAgo(ago(ms), now)).toBe(expected));
  it("falls back to a date for old posts and never goes negative", () => {
    expect(timeAgo(ago(90 * 86400_000), now)).toMatch(/Mar/);
    expect(timeAgo(new Date(now + 60_000).toISOString(), now)).toBe("now");
  });
});

describe("plural", () => {
  it("handles one and many", () => {
    expect(plural(1, "post")).toBe("post");
    expect(plural(2, "post")).toBe("posts");
    expect(plural(0, "post")).toBe("posts");
  });
});
