/**
 * Demo data for local development (runs automatically on first `npm run dev`; manually: `npm run db:seed`).
 * WARNING: without --if-empty this deletes ALL existing users and content.
 * All accounts share the password "password123". Never run this against production.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database");

const db = new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");

// Small deterministic PRNG so every seed run looks the same.
let state = 42;
const rnd = () => ((state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];

const PALETTES = [
  ["#4f6bff", "#9b5cff"], ["#ff7a59", "#ffb14f"], ["#22c1c3", "#4f6bff"], ["#ff5c8a", "#ffb14f"],
  ["#11998e", "#38ef7d"], ["#fc466b", "#3f5efb"], ["#f7971e", "#ffd200"], ["#614385", "#516395"],
  ["#00c6ff", "#0072ff"], ["#f953c6", "#b91d73"],
];

async function makeImage(w: number, h: number, label: string) {
  const [a, b] = pick(PALETTES);
  const shapes = Array.from({ length: 6 }, () => {
    const cx = Math.round(rnd() * w), cy = Math.round(rnd() * h), r = Math.round(60 + rnd() * Math.min(w, h) * 0.35);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity="${(0.06 + rnd() * 0.18).toFixed(2)}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>${shapes}
    <text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(w / 9)}" font-weight="700" fill="#fff" opacity="0.9">${label}</text>
  </svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  const tiny = await sharp(data).resize(12, 12, { fit: "inside" }).blur(1).webp({ quality: 40 }).toBuffer();
  const key = `${randomUUID()}.webp`;
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, key), data);
  return { key, width: info.width, height: info.height, blur: `data:image/webp;base64,${tiny.toString("base64")}` };
}

const USERS = [
  { username: "demo", name: "Demo User", bio: "Trying out Moments ✨" },
  { username: "alice", name: "Alice Johnson", bio: "Coffee, sunsets and street photography ☕️" },
  { username: "bob", name: "Bob Martin", bio: "Hiking | Mountains | Film cameras 🏔" },
  { username: "carol", name: "Carol Diaz", bio: "Designer. Plant mom. 🌿" },
  { username: "dave", name: "Dave Kim", bio: "Cooking things and eating them 🍜" },
  { username: "eve", name: "Eve Novak", bio: "Travel • Architecture • Light" },
  { username: "frank", name: "Frank Osei", bio: "Football, music, good vibes" },
  { username: "grace", name: "Grace Lee", bio: "Illustrator ✏️ commissions open" },
];

const CAPTIONS = [
  "Golden hour never gets old #sunset #golden #photography",
  "Sunday reset ☕️ #coffee #weekend",
  "Lost in the city lights #city #night #streetphotography",
  "New week, new goals 💪 #motivation",
  "Found this little spot today 🌿 #nature #plants",
  "Dinner was unreal 🍜 #foodie #homecooking",
  "Throwback to the mountains #hiking #mountains #travel",
  "Colors everywhere #design #color #art",
  "Can't stop looking at this view #travel #views",
  "Quiet morning #minimal #morning",
];
const COMMENTS = ["Love this! 😍", "Amazing shot", "Wow, where is this?", "🔥🔥🔥", "Goals!", "So good", "This made my day", "Beautiful colors", "Need to go there!", "Great composition 👏"];

async function main() {
  // `--if-empty` is used by `npm run dev`: only seed a brand-new database, never wipe real data.
  if (process.argv.includes("--if-empty") && (await db.user.count()) > 0) return;

  console.log("Resetting demo data…");
  // Remove the image files that belong to the rows we're about to delete (and only those).
  const keys = [
    ...(await db.postImage.findMany({ select: { key: true } })).map((r) => r.key),
    ...(await db.story.findMany({ select: { key: true } })).map((r) => r.key),
    ...(await db.user.findMany({ select: { avatarKey: true } })).flatMap((r) => (r.avatarKey ? [r.avatarKey] : [])),
  ];
  await Promise.all(keys.map((k) => fs.unlink(path.join(uploadDir, path.basename(k))).catch(() => undefined)));
  await db.user.deleteMany(); // cascades everything
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = [];
  for (const u of USERS) {
    const avatar = await makeImage(320, 320, u.name[0]);
    users.push(await db.user.create({ data: { ...u, email: `${u.username}@example.com`, passwordHash, avatarKey: avatar.key } }));
  }
  const [demo, ...others] = users;

  // Everyone follows a few others; demo follows the first four.
  for (const o of others.slice(0, 4)) await db.follow.create({ data: { followerId: demo.id, followingId: o.id } });
  for (const u of users) {
    for (const o of users) {
      if (u.id === o.id || u.id === demo.id) continue;
      if (rnd() < 0.45) await db.follow.createMany({ data: [{ followerId: u.id, followingId: o.id }] }).catch(() => undefined);
    }
  }
  await db.follow.createMany({ data: [{ followerId: others[1].id, followingId: demo.id }, { followerId: others[2].id, followingId: demo.id }] }).catch(() => undefined);

  let postCount = 0;
  for (const [ui, u] of users.entries()) {
    const n = ui === 0 ? 2 : 3 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const caption = pick(CAPTIONS);
      const count = rnd() < 0.3 ? 2 + Math.floor(rnd() * 3) : 1;
      const [w, h] = pick([[1080, 1080], [1080, 1350], [1350, 1080]]);
      const images = [];
      for (let k = 0; k < count; k++) images.push(await makeImage(w, h, `${u.username} #${++postCount}`));
      const tags = [...caption.matchAll(/#(\w+)/g)].map((m) => m[1].toLowerCase());
      const post = await db.post.create({
        data: {
          authorId: u.id,
          caption,
          createdAt: new Date(Date.now() - Math.floor(rnd() * 6 * 24 * 3600 * 1000) - i * 3600 * 1000),
          images: { create: images.map((img, position) => ({ ...img, position })) },
          tags: { create: [...new Set(tags)].map((tag) => ({ tag })) },
        },
      });
      for (const liker of users) if (liker.id !== u.id && rnd() < 0.5) await db.like.create({ data: { userId: liker.id, postId: post.id } });
      for (const c of users) {
        if (c.id !== u.id && rnd() < 0.25) {
          await db.comment.create({ data: { postId: post.id, authorId: c.id, text: pick(COMMENTS), createdAt: new Date(post.createdAt.getTime() + 60_000 * (1 + Math.floor(rnd() * 600))) } });
        }
      }
    }
  }

  for (const u of others.slice(0, 3)) {
    const s = await makeImage(1080, 1920, `${u.username}’s day`);
    await db.story.create({ data: { authorId: u.id, key: s.key, width: s.width, height: s.height, expiresAt: new Date(Date.now() + 20 * 3600 * 1000) } });
  }

  // A conversation + notifications for the demo user.
  const [a, b] = demo.id < others[0].id ? [demo.id, others[0].id] : [others[0].id, demo.id];
  const convo = await db.conversation.create({ data: { userAId: a, userBId: b, userAReadAt: new Date(0), userBReadAt: new Date(0) } });
  const msgs = [[others[0].id, "Hey! Welcome to Moments 👋"], [demo.id, "Thanks Alice, loving it so far!"], [others[0].id, "Check out the Explore tab — lots of cool shots."]] as const;
  for (const [i, [sender, text]] of msgs.entries()) await db.message.create({ data: { conversationId: convo.id, senderId: sender, text, createdAt: new Date(Date.now() - (msgs.length - i) * 60_000) } });
  await db.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date() } });

  const demoPost = await db.post.findFirst({ where: { authorId: demo.id } });
  if (demoPost) {
    await db.notification.create({ data: { recipientId: demo.id, actorId: others[0].id, type: "like", postId: demoPost.id } });
    await db.notification.create({ data: { recipientId: demo.id, actorId: others[1].id, type: "comment", postId: demoPost.id, text: "Great shot!" } });
  }
  await db.notification.create({ data: { recipientId: demo.id, actorId: others[2].id, type: "follow" } });

  console.log(`Done: ${users.length} users, ${postCount} images. Log in as demo@example.com / password123`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
