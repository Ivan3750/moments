#!/usr/bin/env node
/**
 * First-run setup, executed automatically before `npm run dev` (and manually via `npm run setup`).
 * Idempotent: safe to run any number of times.
 *   1. creates .env with a random SESSION_SECRET if it doesn't exist
 *   2. applies database migrations (creates dev.db)
 *   3. fills an EMPTY database with demo data (never touches a database that already has users)
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`\n✖ "${cmd} ${args.join(" ")}" failed. See the output above.`);
    process.exit(r.status ?? 1);
  }
};

if (!fs.existsSync(".env")) {
  const example = fs.existsSync(".env.example") ? fs.readFileSync(".env.example", "utf8") : "";
  const secret = randomBytes(48).toString("base64");
  const env = example.includes("SESSION_SECRET=")
    ? example.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${secret}"`)
    : `DATABASE_URL="file:./dev.db"\nSESSION_SECRET="${secret}"\nUPLOAD_DIR="./uploads"\nNEXT_PUBLIC_SITE_URL="http://localhost:3000"\n`;
  fs.writeFileSync(".env", env);
  console.log("✔ Created .env with a fresh SESSION_SECRET");
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["tsx", "prisma/seed.ts", "--if-empty"]);
