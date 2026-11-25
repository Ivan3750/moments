"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button, Spinner } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { changePassword, deleteAccount, updateProfile, type SettingsState } from "@/actions/users";

type Profile = { username: string; name: string; bio: string; website: string; email: string; avatar: string | null };

export function AvatarUploader({ username, avatar: initial }: { username: string; avatar: string | null }) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(initial);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function send(method: "POST" | "DELETE", file?: File) {
    setBusy(true);
    try {
      const form = new FormData();
      if (file) form.append("image", file);
      const res = await fetch("/api/avatar", { method, body: file ? form : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't update your photo");
      setAvatar(data.avatar);
      toast.success(method === "DELETE" ? "Photo removed" : "Profile photo updated");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-subtle p-4">
      <Avatar user={{ username, avatar }} size={64} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{username}</p>
        <div className="mt-1 flex gap-3 text-sm">
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="font-semibold text-accent hover:underline disabled:opacity-50">
            {busy ? "Working…" : "Change photo"}
          </button>
          {avatar && (
            <button type="button" disabled={busy} onClick={() => send("DELETE")} className="text-muted hover:text-like disabled:opacity-50">
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void send("POST", file);
        }}
      />
    </div>
  );
}

function useToastOnOk(state: SettingsState, message: string) {
  useEffect(() => {
    if (state?.ok) toast.success(message);
    if (state?.error) toast.error(state.error);
  }, [state, message]);
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfile, null);
  const [bio, setBio] = useState(profile.bio);
  useToastOnOk(state, "Profile saved");
  const fe = state?.fieldErrors ?? {};
  const v = state?.values ?? profile;

  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Username" name="username" defaultValue={v.username} autoCapitalize="none" error={fe.username?.[0]} hint="You can change this at any time." />
      <Field label="Name" name="name" defaultValue={v.name} maxLength={50} error={fe.name?.[0]} />
      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={150}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full resize-none rounded-lg border border-line bg-subtle p-3 text-[15px] outline-none focus:border-accent focus:bg-bg focus:ring-2 focus:ring-accent/25"
        />
        <p className="mt-1 text-right text-xs text-muted">{bio.length}/150</p>
        {fe.bio?.[0] && <p className="text-sm text-like">{fe.bio[0]}</p>}
      </div>
      <Field label="Website" name="website" type="url" defaultValue={v.website} placeholder="https://" error={fe.website?.[0]} />
      <Field label="Email" name="email" value={profile.email} readOnly disabled hint="Email can't be changed yet." />
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />} Save changes
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(changePassword, null);
  const formRef = useRef<HTMLFormElement>(null);
  useToastOnOk(state, "Password updated. Other devices were signed out.");
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  const fe = state?.fieldErrors ?? {};

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      <Field label="Current password" name="current" type="password" autoComplete="current-password" error={fe.current?.[0]} />
      <Field label="New password" name="next" type="password" autoComplete="new-password" error={fe.next?.[0]} hint="At least 8 characters" />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending && <Spinner />} Change password
      </Button>
    </form>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SettingsState, FormData>(deleteAccount, null);
  const fe = state?.fieldErrors ?? {};
  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <>
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete account" className="w-[min(92vw,26rem)]" hideClose>
        <form action={action} className="space-y-4 p-6" noValidate>
          <div>
            <h2 className="text-lg font-semibold">Delete your account?</h2>
            <p className="mt-1 text-sm text-muted">This permanently deletes your profile, photos, stories, comments and messages. It can&apos;t be undone.</p>
          </div>
          <Field label="Confirm with your password" name="password" type="password" autoComplete="current-password" error={fe.password?.[0]} />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" className="flex-1" disabled={pending}>
              {pending && <Spinner />} Delete forever
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
