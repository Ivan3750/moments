import { z } from "zod";

export const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "login", "logout", "register", "signup", "explore", "music", "settings",
  "messages", "notifications", "search", "tags", "p", "stories", "media", "static", "about", "help",
  "support", "moments", "null", "undefined", "me", "root", "system",
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-z0-9._]+$/, "Only letters, numbers, dots and underscores")
  .refine((v) => !v.startsWith(".") && !v.endsWith(".") && !v.includes(".."), "Invalid dots in username")
  .refine((v) => !RESERVED_USERNAMES.has(v), "This username is not available");

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email"));

// bcrypt only uses the first 72 bytes, so cap there.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((v) => new TextEncoder().encode(v).length <= 72, "Password is too long");

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1, "Enter your email or username").max(254),
  password: z.string().min(1, "Enter your password").max(200),
});

export const profileSchema = z.object({
  username: usernameSchema,
  name: z.string().trim().max(50, "Name is too long"),
  bio: z.string().trim().max(150, "Bio is limited to 150 characters"),
  website: z
    .string()
    .trim()
    .max(100)
    .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Website must start with http:// or https://"),
});

export const changePasswordSchema = z.object({
  current: z.string().min(1, "Enter your current password"),
  next: passwordSchema,
});

export const captionSchema = z.string().trim().max(2200, "Caption is limited to 2,200 characters");
export const commentSchema = z.string().trim().min(1, "Write something").max(500, "Comment is too long");
export const messageSchema = z.string().trim().min(1).max(2000);

export const deezerId = z.string().regex(/^\d{1,15}$/);

export const cuid = z.string().min(10).max(40).regex(/^[a-z0-9]+$/i);

export type FieldErrors = Record<string, string[] | undefined>;
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
