# Moments

A photo-sharing social network: feed, stories, comments, saves, hashtags, notifications, direct messages and music previews.
Built with **Next.js 16 (App Router)**, TypeScript, Tailwind CSS 4 and Prisma (SQLite by default, Postgres-ready).

## Run it locally

Requirements: **Node.js 20.9+** (22 recommended). Nothing else — no database server, no accounts.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. On the first run `npm run dev` automatically:

1. creates `.env` with a random `SESSION_SECRET`,
2. creates the SQLite database (`dev.db`) and applies the migrations,
3. fills the empty database with demo data.

Log in with **`demo@example.com` / `password123`** (other demo users: `alice`, `bob`, `carol`, `dave`, `eve`, `frank`, `grace` — same password).
To start over with fresh demo data: `npm run db:seed` (⚠ deletes all existing users and posts).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (runs the first-run setup automatically) |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Features

- **Auth**: register / log in with email or username; httpOnly cookie sessions; changing the password signs out other devices.
- **Feed**: posts from people you follow, infinite scroll, multi-photo carousel, double-tap to like, saves, comments, `#hashtags`, `@mentions`.
- **Stories** (24h), **notifications**, **1:1 messages** (polling), **explore** and search for people/hashtags, **profiles** with followers/following.
- **Music**: search Deezer and attach a 30-second preview to a post.
- **Settings**: profile, avatar, password, delete account. Light/dark theme.
- Responsive: sidebar on desktop, bottom navigation on phones.

## Configuration (`.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | SQLite file. |
| `SESSION_SECRET` | generated | ≥ 32 chars. **Set your own in production.** |
| `UPLOAD_DIR` | `./uploads` | Where images are stored (local disk). |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Used for metadata. |
| `DEEZER_API_URL` | Deezer public API | Optional override (e.g. a mock for tests). |

## Project layout

```
prisma/            schema, migrations, seed
scripts/setup.mjs  first-run setup (.env, migrations, demo data)
src/app/           routes: (auth) login/register, (app) feed/explore/profile/…, api/ handlers, media/
src/actions/       server actions (all mutations; each checks the session)
src/lib/           auth, db, images, storage, validation, data queries
src/components/    UI (shell, post, stories, messages, music, …)
```

## Notes for production

- Uses the in-process rate limiter and local disk for uploads: fine for one instance. For several, use a shared store (Redis) and object storage (S3/R2) — `src/lib/storage.ts` is the only place that touches files.
- To use Postgres: change the `provider` in `prisma/schema.prisma`, swap the adapter in `src/lib/db.ts`, set `DATABASE_URL`, run `npm run db:migrate`.
- Expired stories are hidden by queries but their files are not deleted automatically; add a periodic cleanup job.

## Security note about the old version

The previous (Express) version had a MongoDB password, a JWT secret and several API keys committed to git. They are removed from the code but **still exist in git history** — rotate/revoke them at the providers.
