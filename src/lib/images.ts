import "server-only";
import sharp, { type Sharp } from "sharp";
import { saveImage } from "@/lib/storage";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "heif"]);

export class ImageError extends Error {}

export type StoredImage = { key: string; width: number; height: number; blur: string };

async function open(file: File) {
  if (!(file instanceof File) || file.size === 0) throw new ImageError("Choose an image to upload");
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageError("Image is too large (max 12 MB)");
  const input = Buffer.from(await file.arrayBuffer());
  try {
    // Guard against decompression bombs; rotate() applies EXIF orientation. Output never keeps metadata (GPS etc.).
    const img = sharp(input, { limitInputPixels: 60_000_000, failOn: "error" }).rotate();
    const meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
    if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new ImageError("Unsupported image type");
    return img;
  } catch (e) {
    if (e instanceof ImageError) throw e;
    throw new ImageError("This file isn't a valid image");
  }
}

async function blurOf(buf: Buffer) {
  const tiny = await sharp(buf).resize(12, 12, { fit: "inside" }).blur(1).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${tiny.toString("base64")}`;
}

async function finish(pipeline: Sharp): Promise<StoredImage> {
  try {
    const { data, info } = await pipeline.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    return { key: await saveImage(data), width: info.width, height: info.height, blur: await blurOf(data) };
  } catch {
    throw new ImageError("Couldn't process this image");
  }
}

/** Feed photo: fit inside 1440px, keep aspect ratio. */
export async function processPostImage(file: File) {
  return finish((await open(file)).resize({ width: 1440, height: 1800, fit: "inside", withoutEnlargement: true }));
}

/** Avatar: square crop. */
export async function processAvatar(file: File) {
  return finish((await open(file)).resize(320, 320, { fit: "cover", position: "attention" }));
}

/** Story: fit inside a 1080x1920 frame. */
export async function processStoryImage(file: File) {
  return finish((await open(file)).resize({ width: 1080, height: 1920, fit: "inside", withoutEnlargement: true }));
}
