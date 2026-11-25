"use client";

import { useState } from "react";
import Link from "next/link";
import { Link as LinkIcon, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClass } from "@/components/ui/button";
import { FollowButton } from "@/components/post/follow-button";
import { RichText } from "@/components/post/rich-text";
import { openConversation } from "@/actions/social";
import { formatCount, plural } from "@/lib/format";
import type { ProfileView } from "@/lib/types";

export function ProfileHeader({ profile }: { profile: ProfileView }) {
  const [followers, setFollowers] = useState(profile.followerCount);
  const base = `/${profile.username}`;
  const stat = "text-center md:text-left";

  return (
    <header className="flex flex-col gap-5 px-4 pt-5 md:flex-row md:gap-16 md:px-4 md:pt-10">
      <div className="flex items-center gap-6 md:block md:shrink-0">
        <Avatar user={profile} size={96} className="md:size-[150px]" />
        <div className="md:hidden">
          <Title profile={profile} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="hidden md:block">
          <Title profile={profile} />
        </div>

        <div className="mb-4 mt-4 flex gap-2 md:mt-5">
          {profile.isMe ? (
            <Link href="/settings" className={buttonClass("secondary", "md", "flex-1 md:flex-none")}>
              <Settings className="size-4" /> Edit profile
            </Link>
          ) : (
            <>
              <FollowButton
                userId={profile.id}
                initialFollowing={profile.isFollowing}
                followsYou={profile.followsYou}
                onChange={(_f, count) => setFollowers(count)}
                className="flex-1 md:flex-none md:min-w-28"
              />
              <form action={openConversation.bind(null, profile.id)} className="flex-1 md:flex-none">
                <Button type="submit" variant="secondary" className="w-full">
                  Message
                </Button>
              </form>
            </>
          )}
        </div>

        <ul className="mb-4 grid grid-cols-3 gap-2 border-y border-line py-3 md:flex md:gap-10 md:border-0 md:py-0">
          <li className={stat}>
            <span className="block font-semibold md:inline">{formatCount(profile.postCount)}</span> <span className="text-sm text-muted md:text-fg">{plural(profile.postCount, "post")}</span>
          </li>
          <li className={stat}>
            <Link href={`${base}/followers`} className="hover:opacity-70">
              <span className="block font-semibold md:inline">{formatCount(followers)}</span> <span className="text-sm text-muted md:text-fg">{plural(followers, "follower")}</span>
            </Link>
          </li>
          <li className={stat}>
            <Link href={`${base}/following`} className="hover:opacity-70">
              <span className="block font-semibold md:inline">{formatCount(profile.followingCount)}</span> <span className="text-sm text-muted md:text-fg">following</span>
            </Link>
          </li>
        </ul>

        <div className="space-y-0.5 text-sm">
          {profile.name && <p className="font-semibold">{profile.name}</p>}
          {profile.bio && (
            <p className="whitespace-pre-line break-words">
              <RichText text={profile.bio} />
            </p>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
              <LinkIcon className="size-3.5" />
              {profile.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function Title({ profile }: { profile: ProfileView }) {
  return (
    <div>
      <h1 className="text-xl font-light md:text-2xl">{profile.username}</h1>
      {profile.followsYou && !profile.isMe && <span className="mt-1 inline-block rounded bg-subtle px-1.5 py-0.5 text-xs text-muted">Follows you</span>}
    </div>
  );
}
