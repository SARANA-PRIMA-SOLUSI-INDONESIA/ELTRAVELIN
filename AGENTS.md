<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Developer Commands

```bash
npm run dev           # Start dev server
npm run build         # Runs prisma generate && next build
npm run lint          # ESLint only (no typecheck or test scripts)
npm run db:migrate    # Create + apply migration on DEV
npm run db:deploy     # Apply pending migrations on DEV
npm run db:deploy:prod # Apply pending migrations on PROD
npm run db:status     # Migration status (DEV)
npm run db:generate   # prisma generate
```

# Prisma

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/` (prefer `migrate` over `db push`)
- Seed: `npm run prisma:seed` (runs `tsx prisma/seed.ts`)
- Config: `prisma.config.ts` — DEV uses `DATABASE_URL_DEV`, PROD uses `DATABASE_URL_PROD` when `NODE_ENV=production`
- Run `prisma generate` before building

# Stack

- **Framework:** Next.js 16 with App Router (React 19)
- **Styling:** Tailwind CSS v4 (configured in `postcss.config.mjs`, globals in `app/globals.css`)
- **Database:** MySQL via Prisma 7 with `@prisma/adapter-mariadb`
- **Auth:** JWT via `jose`
- **Design tokens:** CSS variables in `:root` (see `app/globals.css`) — colors like `navy-deep`, `gold-warm`, `surface-*`
- **Icons:** Remix Icon (`<i class="ri-*"></i>`)
- **Fonts:** Manrope (display), Inter (body)

# Path Alias

Use `@/*` to reference files: `import X from "@/components/X"`
