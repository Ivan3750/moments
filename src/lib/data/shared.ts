import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { mediaUrl } from "@/lib/storage";
import type { ImageView, Page, UserLite } from "@/lib/types";

export const userLiteSelect = { id: true, username: true, name: true, avatarKey: true } as const;

export function toUserLite(u: { id: string; username: string; name: string; avatarKey: string | null }): UserLite {
  return { id: u.id, username: u.username, name: u.name, avatar: mediaUrl(u.avatarKey) };
}

export function toImageView(i: { key: string; width: number; height: number; blur: string }): ImageView {
  return { url: mediaUrl(i.key)!, width: i.width, height: i.height, blur: i.blur };
}

/** Cursor pagination: query `take + 1` rows, the extra one only signals "there is more". */
export function cursorArgs(cursor: string | null | undefined, take: number) {
  return { take: take + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) };
}

export function toPage<T extends { id: string }, U>(rows: T[], take: number, map: (row: T) => U): Page<U> {
  const hasMore = rows.length > take;
  const slice = hasMore ? rows.slice(0, take) : rows;
  return { items: slice.map(map), nextCursor: hasMore ? slice[slice.length - 1].id : null };
}

export type { Prisma };
