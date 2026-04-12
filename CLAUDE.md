# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TENANTNET.NYC — tenant forum and issue tracker for 449 West 125th Street, a 17-unit rent-stabilized building in Harlem.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (CSS-based config, not tailwind.config.ts)
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Database:** PostgreSQL on Railway
- **Image storage:** Vercel Blob
- **QR generation:** `qrcode` npm package
- **Deployment:** Vercel

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma db seed   # Seed units, sections, admin
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma studio    # Visual database browser
```

## Architecture

- **Auth:** QR-code-based for tenants (scan code on apartment door), email/password for admin. Sessions stored in DB, validated via `httpOnly` cookie (`tn_session`).
- **Identity:** Posts attributed to units ("Unit 3B"), not individual people. Admin posts show as "Building Admin".
- **Prisma 7 specifics:** Client generated to `src/generated/prisma/` (gitignored). Import from `@/generated/prisma/client`, NOT `@/generated/prisma` or `@prisma/client`. Requires `PrismaPg` adapter.
- **Cookie limitation:** Next.js 16 cannot set cookies in Server Components. The QR auth flow uses a Route Handler (`route.ts`), not a page component.

## Key Files

- `src/lib/auth.ts` — session helpers: `getSession()`, `requireUnit()`, `requireAdmin()`, `createUnitSession()`, `createAdminSession()`
- `src/lib/db.ts` — Prisma client singleton with PrismaPg adapter
- `src/lib/constants.ts` — status colors, image limits, cookie config
- `prisma/schema.prisma` — 7 models: Unit, Admin, Session, Section, Post, Comment, Image
- `prisma/seed.ts` — seeds 17 units, 5 sections, 1 admin

## Environment Variables

- `DATABASE_URL` — Railway PostgreSQL connection string (in `.env` for Prisma CLI, `.env.local` for Next.js)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage token
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — used by seed script only
