import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Join Moments</h1>
      <p className="mb-6 text-muted">Create an account to share photos and stories.</p>
      <AuthForm mode="register" />
    </>
  );
}
