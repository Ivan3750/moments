"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Spinner } from "@/components/ui/button";
import { setFollow } from "@/actions/users";

export function FollowButton({
  userId,
  initialFollowing,
  followsYou = false,
  size = "md",
  onChange,
  className,
}: {
  userId: string;
  initialFollowing: boolean;
  followsYou?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (following: boolean, followerCount: number) => void;
  className?: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  function click() {
    const next = !following;
    setFollowing(next); // optimistic
    start(async () => {
      const res = await setFollow(userId, next);
      if (!res.ok) {
        setFollowing(!next);
        toast.error(res.error);
      } else {
        onChange?.(res.data.following, res.data.followerCount);
      }
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant={following ? "secondary" : "primary"}
      onClick={click}
      aria-pressed={following}
      className={className}
    >
      {pending && <Spinner className="size-3.5" />}
      {following ? "Following" : followsYou ? "Follow back" : "Follow"}
    </Button>
  );
}
