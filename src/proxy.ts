import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/session-cookie";

const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Optimistic gate: bounce visitors without a valid session cookie to /login
 * before any page renders. Pages and handlers still verify the user against the
 * database — this only keeps the logged-out experience fast and tidy.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  let valid = false;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid && !isPublic) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  // Note: logged-in visitors on /login are redirected by the (auth) layout, which can see whether the
  // session is truly valid. Doing it here would loop for revoked sessions (valid signature, stale password).
  return NextResponse.next();
}

export const config = {
  // Everything except API routes (they answer 401 themselves), media, Next internals and static files.
  matcher: ["/((?!api|media|_next|favicon.ico|logo.png|icon|manifest.webmanifest).*)"],
};
