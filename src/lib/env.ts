import "server-only";
import path from "node:path";

/** Read lazily so `next build` works without a populated environment. */
export function sessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. Generate one with `openssl rand -base64 48` and put it in .env",
    );
  }
  return new TextEncoder().encode(secret);
}

export function uploadDir(): string {
  // The hint stops the bundler from tracing the whole project as a dependency of this runtime path.
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR || "./uploads");
}

export const isProd = process.env.NODE_ENV === "production";
