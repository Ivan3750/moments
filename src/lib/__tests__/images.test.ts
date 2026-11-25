import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ImageError, processAvatar, processPostImage } from "@/lib/images";
import { isValidKey, readImage } from "@/lib/storage";

let dir: string;
beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "moments-test-"));
  process.env.UPLOAD_DIR = dir;
});
afterAll(async () => fs.rm(dir, { recursive: true, force: true }));

const fileOf = (buf: Buffer, name = "x.jpg", type = "image/jpeg") => new File([new Uint8Array(buf)], name, { type });

describe("image processing", () => {
  it("resizes, converts to webp, strips EXIF and stores under a random key", async () => {
    const jpeg = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#4f6bff" } })
      .withExif({ IFD0: { Copyright: "secret" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(jpeg).metadata()).exif).toBeDefined();

    const out = await processPostImage(fileOf(jpeg));
    expect(isValidKey(out.key)).toBe(true);
    expect(out.width).toBe(1440);
    expect(out.height).toBe(960);
    expect(out.blur).toMatch(/^data:image\/webp;base64,/);

    const stored = await readImage(out.key);
    const meta = await sharp(stored!).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
  });

  it("never upscales small images", async () => {
    const png = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#fff" } }).png().toBuffer();
    const out = await processPostImage(fileOf(png, "s.png", "image/png"));
    expect([out.width, out.height]).toEqual([200, 100]);
  });

  it("applies EXIF orientation", async () => {
    const rotated = await sharp({ create: { width: 400, height: 200, channels: 3, background: "#000" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const out = await processPostImage(fileOf(rotated));
    expect([out.width, out.height]).toEqual([200, 400]);
  });

  it("crops avatars to a 320px square", async () => {
    const png = await sharp({ create: { width: 800, height: 500, channels: 3, background: "#e91e63" } }).png().toBuffer();
    const out = await processAvatar(fileOf(png, "a.png", "image/png"));
    expect([out.width, out.height]).toEqual([320, 320]);
  });

  it("rejects files that are not images, whatever their name or type claim", async () => {
    await expect(processPostImage(fileOf(Buffer.from("<?php echo 1; ?>"), "evil.jpg"))).rejects.toBeInstanceOf(ImageError);
    await expect(processPostImage(fileOf(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), "x.svg", "image/svg+xml"))).rejects.toBeInstanceOf(ImageError);
  });

  it("rejects empty and oversized uploads", async () => {
    await expect(processPostImage(fileOf(Buffer.alloc(0)))).rejects.toThrow(/Choose an image/);
    await expect(processPostImage(fileOf(Buffer.alloc(13 * 1024 * 1024, 1)))).rejects.toThrow(/too large/);
  });
});

describe("storage keys", () => {
  it.each(["../../etc/passwd", "..%2f.env", "abc.webp", "00000000-0000-0000-0000-000000000000.png", "00000000-0000-0000-0000-000000000000.webp/../x"])(
    "rejects %s",
    (k) => expect(isValidKey(k)).toBe(false),
  );
  it("accepts generated keys and returns null for unknown files", async () => {
    const key = "11111111-2222-3333-4444-555555555555.webp";
    expect(isValidKey(key)).toBe(true);
    expect(await readImage(key)).toBeNull();
    expect(await readImage("../x")).toBeNull();
  });
});
