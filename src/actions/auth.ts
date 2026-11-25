"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema, registerSchema, type FieldErrors } from "@/lib/validation";
import { isUniqueViolation } from "@/lib/action";
import { safeRedirectPath } from "@/lib/safe-redirect";

export type AuthState = {
  error?: string;
  fieldErrors?: FieldErrors;
  values?: { username?: string; email?: string; identifier?: string };
} | null;

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { username: raw.username, email: raw.email };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const { username, email, password } = parsed.data;

  // Only well-formed attempts count: typos shouldn't lock anyone out, but each of these costs a bcrypt hash.
  const limit = rateLimit(`register:${await clientIp()}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return { error: `Too many sign-ups from your network. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`, values };

  const clash = await db.user.findFirst({ where: { OR: [{ username }, { email }] }, select: { username: true } });
  if (clash) {
    return {
      fieldErrors: clash.username === username ? { username: ["This username is taken"] } : { email: ["An account with this email already exists"] },
      values,
    };
  }

  let user;
  try {
    user = await db.user.create({ data: { username, email, passwordHash: await hashPassword(password), name: "" } });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "That username or email was just taken. Try another.", values };
    throw e;
  }
  await createSession(user);
  redirect("/");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = { identifier: String(formData.get("identifier") ?? ""), password: String(formData.get("password") ?? "") };
  const values = { identifier: raw.identifier };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const { identifier, password } = parsed.data;

  const limit = rateLimit(`login:${await clientIp()}:${identifier}`, 8, 10 * 60 * 1000);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`, values };

  const user = await db.user.findUnique({
    where: identifier.includes("@") ? { email: identifier } : { username: identifier },
  });
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid) return { error: "Incorrect username/email or password.", values };

  await createSession(user);
  redirect(safeRedirectPath(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
