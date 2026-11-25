import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { uploadDir } from "@/lib/env";

/**
 * Local-disk storage. The rest of the app only deals in opaque keys, so this
 * module is the single place to swap for S3/R2/etc.
 */
const KEY_RE = /^[a-f0-9-]{36}\.webp$/;

export const isValidKey = (key: string) => KEY_RE.test(key);
export const mediaUrl = (key: string | null | undefined) => (key ? `/media/${key}` : null);

export async function saveImage(buffer: Buffer): Promise<string> {
  const key = `${randomUUID()}.webp`;
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, key), buffer);
  return key;
}

export async function readImage(key: string): Promise<Buffer | null> {
  if (!isValidKey(key)) return null;
  try {
    return await fs.readFile(path.join(uploadDir(), key));
  } catch {
    return null;
  }
}

export async function deleteImages(keys: (string | null | undefined)[]) {
  await Promise.all(
    keys
      .filter((k): k is string => !!k && isValidKey(k))
      .map((k) => fs.unlink(path.join(uploadDir(), k)).catch(() => undefined)),
  );
}
