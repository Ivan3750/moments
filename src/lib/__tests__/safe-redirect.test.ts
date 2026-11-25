import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it.each(["/", "/explore", "/p/abc?x=1", "/tags/sunset"])("allows %s", (p) => expect(safeRedirectPath(p)).toBe(p));
  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "evil.com", "", "/ok\r\nSet-Cookie: x=1", null, undefined, 42])(
    "blocks %j",
    (p) => expect(safeRedirectPath(p)).toBe("/"),
  );
  it("supports a custom fallback", () => expect(safeRedirectPath("//x", "/home")).toBe("/home"));
});
