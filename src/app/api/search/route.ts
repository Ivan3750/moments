import { authed, json } from "@/lib/api";
import { searchUsers } from "@/lib/data/users";
import { searchTags } from "@/lib/data/posts";

export async function GET(req: Request) {
  const { res } = await authed();
  if (res) return res;
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 60);
  if (q.trim().length < 1) return json({ users: [], tags: [] });
  const [users, tags] = await Promise.all([searchUsers(q), searchTags(q)]);
  return json({ users, tags });
}
