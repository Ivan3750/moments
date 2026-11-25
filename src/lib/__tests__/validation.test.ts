import { describe, expect, it } from "vitest";
import { changePasswordSchema, commentSchema, fieldErrors, loginSchema, passwordSchema, profileSchema, registerSchema, usernameSchema } from "@/lib/validation";

describe("usernameSchema", () => {
  it("normalises case and whitespace", () => {
    expect(usernameSchema.parse("  Alice_01 ")).toBe("alice_01");
  });
  it.each(["ab", "a".repeat(31), "has space", "bad!", ".start", "end.", "dou..ble", "ünïcode"])("rejects %j", (v) => {
    expect(usernameSchema.safeParse(v).success).toBe(false);
  });
  it.each(["admin", "Explore", "settings", "api", "p"])("rejects reserved name %j", (v) => {
    expect(usernameSchema.safeParse(v).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("requires 8+ characters", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });
  it("rejects passwords over bcrypt's 72-byte limit (counted in bytes, not characters)", () => {
    expect(passwordSchema.safeParse("a".repeat(72)).success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false);
    expect(passwordSchema.safeParse("я".repeat(37)).success).toBe(false); // 74 bytes
  });
});

describe("registerSchema", () => {
  it("lower-cases the email and trims", () => {
    const r = registerSchema.parse({ username: "Bob", email: "  Bob@Example.COM ", password: "password1" });
    expect(r).toEqual({ username: "bob", email: "bob@example.com", password: "password1" });
  });
  it("collects every field error", () => {
    const r = registerSchema.safeParse({ username: "x", email: "nope", password: "1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error)).sort()).toEqual(["email", "password", "username"]);
  });
});

describe("loginSchema", () => {
  it("accepts username or email, lower-cased", () => {
    expect(loginSchema.parse({ identifier: " BoB ", password: "x" }).identifier).toBe("bob");
  });
});

describe("profileSchema", () => {
  const base = { username: "alice", name: "Alice", bio: "", website: "" };
  it("allows an empty website but only http(s) otherwise", () => {
    expect(profileSchema.safeParse(base).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, website: "https://example.com/a" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, website: "javascript:alert(1)" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, website: "ftp://example.com" }).success).toBe(false);
  });
  it("limits bio to 150 characters", () => {
    expect(profileSchema.safeParse({ ...base, bio: "x".repeat(151) }).success).toBe(false);
  });
});

describe("misc schemas", () => {
  it("comments are trimmed, non-empty and <= 500", () => {
    expect(commentSchema.safeParse("   ").success).toBe(false);
    expect(commentSchema.parse("  hi ")).toBe("hi");
    expect(commentSchema.safeParse("x".repeat(501)).success).toBe(false);
  });
  it("change password enforces the new password rules", () => {
    expect(changePasswordSchema.safeParse({ current: "old", next: "short" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ current: "old", next: "longenough1" }).success).toBe(true);
  });
});
