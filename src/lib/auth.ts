import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { isProd, sessionSecret } from "@/lib/env";

import { SESSION_COOKIE } from "@/lib/session-cookie";
export { SESSION_COOKIE };
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Short fingerprint of the password hash: changing the password invalidates every other session. */
const fingerprint = (passwordHash: string) =>
  createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);

export async function createSession(user: { id: string; passwordHash: string }) {
  const token = await new SignJWT({ fp: fingerprint(user.passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(sessionSecret());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export type Viewer = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarKey: string | null;
};

/** The signed-in user (or null). Memoised per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, name: true, email: true, avatarKey: true, passwordHash: true },
    });
    if (!user || fingerprint(user.passwordHash) !== payload.fp) return null;
    const { passwordHash: _omit, ...viewer } = user;
    void _omit;
    return viewer;
  } catch {
    return null;
  }
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}
