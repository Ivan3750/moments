// JSON-serialisable shapes shared by server and client components.

export type UserLite = {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
};

export type ImageView = { url: string; width: number; height: number; blur: string };

export type MusicView = { id: string; title: string; artist: string; cover: string };

export type PostView = {
  id: string;
  caption: string;
  createdAt: string;
  author: UserLite;
  images: ImageView[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
  music: MusicView | null;
  /** Latest comments, shown under the post in the feed. */
  preview: CommentView[];
};

/** Lightweight post for grids (profile, explore, tags). */
export type GridPostView = {
  id: string;
  image: ImageView;
  multiple: boolean;
  hasMusic: boolean;
  likeCount: number;
  commentCount: number;
};

export type CommentView = {
  id: string;
  text: string;
  createdAt: string;
  author: UserLite;
};

export type Page<T> = { items: T[]; nextCursor: string | null };

export type ProfileView = UserLite & {
  bio: string;
  website: string;
  createdAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isMe: boolean;
  isFollowing: boolean;
  followsYou: boolean;
};

export type StoryView = {
  id: string;
  url: string;
  width: number;
  height: number;
  createdAt: string;
  seen: boolean;
};

export type StoryGroup = {
  user: UserLite;
  stories: StoryView[];
  allSeen: boolean;
};

export type NotificationView = {
  id: string;
  type: "like" | "comment" | "follow";
  actor: UserLite;
  text: string;
  createdAt: string;
  read: boolean;
  post: { id: string; image: string | null } | null;
  /** Whether the viewer already follows the actor (for the follow-back button). */
  following: boolean;
};

export type MessageView = {
  id: string;
  text: string;
  createdAt: string;
  mine: boolean;
};

export type ConversationView = {
  id: string;
  other: UserLite;
  lastMessage: { text: string; mine: boolean; createdAt: string } | null;
  unread: boolean;
  lastMessageAt: string;
};

export type TrackView = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  preview: string;
  duration: number;
};
