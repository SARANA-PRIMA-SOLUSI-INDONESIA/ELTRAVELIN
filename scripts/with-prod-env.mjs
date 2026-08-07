import { spawnSync } from "node:child_process";

process.env.NODE_ENV = "production";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-prod-env.mjs <prisma-args...>");
  console.error("Example: node scripts/with-prod-env.mjs migrate deploy");
  process.exit(1);
}

const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
