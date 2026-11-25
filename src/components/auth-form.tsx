"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Spinner } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { login, register, type AuthState } from "@/actions/auth";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : register, null);
  const fe = state?.fieldErrors ?? {};
  const v = state?.values ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "register" ? (
        <>
          <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={fe.email?.[0]} required />
          <Field
            label="Username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            defaultValue={v.username}
            error={fe.username?.[0]}
            hint="Letters, numbers, dots and underscores"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            error={fe.password?.[0]}
            hint="At least 8 characters"
            required
          />
        </>
      ) : (
        <>
          <Field
            label="Username or email"
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            defaultValue={v.identifier}
            error={fe.identifier?.[0]}
            required
          />
          <Field label="Password" name="password" type="password" autoComplete="current-password" error={fe.password?.[0]} required />
        </>
      )}

      {state?.error && (
        <p role="alert" className="rounded-lg bg-like/10 px-3 py-2 text-sm text-like">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Spinner />}
        {mode === "login" ? "Log in" : "Create account"}
      </Button>

      <p className="pt-2 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            New to Moments?{" "}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
