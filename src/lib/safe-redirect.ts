/** Only same-site relative paths: blocks open redirects like "//evil.com" or "/\\evil.com". */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  const next = typeof value === "string" ? value : "";
  return /^\/(?![/\\])/.test(next) && !/[\r\n]/.test(next) ? next : fallback;
}
