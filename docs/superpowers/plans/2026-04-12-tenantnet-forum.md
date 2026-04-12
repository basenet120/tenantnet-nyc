# TENANTNET.NYC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tenant forum and issue tracker for a 17-unit rent-stabilized building, with QR-code-based authentication per unit.

**Architecture:** Next.js 15 App Router fullstack application. PostgreSQL on Railway via Prisma ORM. Vercel Blob for image storage. Custom session-based auth — QR tokens for tenants, email/password for admin. Deployed to Vercel.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma, PostgreSQL (Railway), Vercel Blob, `qrcode` npm package

**Spec:** `docs/superpowers/specs/2026-04-12-tenantnet-forum-design.md`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — Tailwind, font, metadata
│   ├── page.tsx                      # Landing/redirect (→ /dashboard if authed, else info page)
│   ├── auth/
│   │   └── [token]/
│   │       └── page.tsx              # QR auth handler — validate, set cookie, redirect
│   ├── dashboard/
│   │   └── page.tsx                  # Unit dashboard — issues, recent posts, bulletins
│   ├── section/
│   │   └── [slug]/
│   │       └── page.tsx              # Section feed — posts list, status filter
│   ├── post/
│   │   └── [id]/
│   │       └── page.tsx              # Single post — thread, comments, images
│   ├── new-post/
│   │   └── page.tsx                  # Post creation form
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx              # Admin email/password login
│   │   ├── page.tsx                  # Admin dashboard — stats, recent activity
│   │   ├── units/
│   │   │   └── page.tsx              # Unit management — QR view/rotate
│   │   ├── sections/
│   │   │   └── page.tsx              # Section management — CRUD, reorder
│   │   └── moderation/
│   │       └── page.tsx              # Pin/delete posts, manage statuses, create bulletins
│   └── api/
│       ├── auth/
│       │   └── admin/
│       │       └── route.ts          # POST admin login
│       ├── posts/
│       │   └── route.ts              # POST create post
│       ├── comments/
│       │   └── route.ts              # POST create comment
│       ├── upload/
│       │   └── route.ts              # POST image upload to Vercel Blob
│       └── admin/
│           ├── units/
│           │   └── [id]/
│           │       └── rotate/
│           │           └── route.ts  # POST rotate QR token
│           ├── sections/
│           │   └── route.ts          # POST/PUT/DELETE section CRUD
│           ├── posts/
│           │   └── [id]/
│           │       └── route.ts      # PATCH pin/status, DELETE post
│           └── comments/
│               └── [id]/
│                   └── route.ts      # DELETE comment
├── lib/
│   ├── auth.ts                       # getSession(), requireUnit(), requireAdmin() helpers
│   ├── db.ts                         # Prisma client singleton
│   └── constants.ts                  # Status enum, image limits, cookie config
├── components/
│   ├── post-card.tsx                 # Post preview card (used in feeds)
│   ├── status-badge.tsx              # Colored status pill
│   ├── image-upload.tsx              # Multi-image upload input (client component)
│   ├── comment-form.tsx              # Add comment form (client component)
│   ├── section-nav.tsx               # Section links sidebar/header
│   └── admin-nav.tsx                 # Admin sidebar navigation
prisma/
├── schema.prisma                     # Full data model
└── seed.ts                           # Seed 17 units + 5 default sections + admin account
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`, `.gitignore`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full Next.js + Tailwind scaffold.

- [ ] **Step 2: Create .env.example**

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
BLOB_READ_WRITE_TOKEN=""
ADMIN_EMAIL="admin@tenantnet.nyc"
ADMIN_PASSWORD="changeme"
```

- [ ] **Step 3: Update .gitignore**

Add these lines to the generated `.gitignore`:

```
.env
.env.local
.superpowers/
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server running on localhost:3000, default page renders.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with TypeScript and Tailwind"
```

---

## Task 2: Prisma Schema & Database Setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma @prisma/client
npx prisma init
```

- [ ] **Step 2: Write the Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Unit {
  id              String    @id @default(uuid())
  floor           Int
  letter          String
  label           String    @unique
  qrToken         String    @unique @map("qr_token")
  qrTokenCreatedAt DateTime @default(now()) @map("qr_token_created_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  sessions Session[]
  posts    Post[]
  comments Comment[]

  @@map("units")
}

model Admin {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")

  sessions Session[]
  posts    Post[]

  @@map("admins")
}

model Session {
  id        String   @id @default(uuid())
  unitId    String?  @map("unit_id")
  adminId   String?  @map("admin_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  unit  Unit?  @relation(fields: [unitId], references: [id])
  admin Admin? @relation(fields: [adminId], references: [id])

  @@map("sessions")
}

model Section {
  id               String  @id @default(uuid())
  name             String
  slug             String  @unique
  description      String  @default("")
  hasIssueTracking Boolean @default(false) @map("has_issue_tracking")
  sortOrder        Int     @default(0) @map("sort_order")

  posts Post[]

  @@map("sections")
}

enum PostStatus {
  reported
  acknowledged
  fixed
  unresolved
}

model Post {
  id        String      @id @default(uuid())
  sectionId String      @map("section_id")
  unitId    String?     @map("unit_id")
  adminId   String?     @map("admin_id")
  title     String
  body      String
  isPinned  Boolean     @default(false) @map("is_pinned")
  status    PostStatus?
  createdAt DateTime    @default(now()) @map("created_at")
  updatedAt DateTime    @updatedAt @map("updated_at")

  section  Section   @relation(fields: [sectionId], references: [id])
  unit     Unit?     @relation(fields: [unitId], references: [id])
  admin    Admin?    @relation(fields: [adminId], references: [id])
  comments Comment[]
  images   Image[]

  @@map("posts")
}

model Comment {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  unitId    String   @map("unit_id")
  body      String
  createdAt DateTime @default(now()) @map("created_at")

  post   Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  unit   Unit    @relation(fields: [unitId], references: [id])
  images Image[]

  @@map("comments")
}

model Image {
  id        String   @id @default(uuid())
  postId    String?  @map("post_id")
  commentId String?  @map("comment_id")
  url       String
  createdAt DateTime @default(now()) @map("created_at")

  post    Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@map("images")
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Create constants**

Create `src/lib/constants.ts`:

```typescript
export const POST_STATUS = ["reported", "acknowledged", "fixed", "unresolved"] as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  reported: { bg: "bg-yellow-100", text: "text-yellow-800" },
  acknowledged: { bg: "bg-green-100", text: "text-green-800" },
  fixed: { bg: "bg-blue-100", text: "text-blue-800" },
  unresolved: { bg: "bg-red-100", text: "text-red-800" },
};

export const IMAGE_LIMITS = {
  maxPerPost: 5,
  maxPerComment: 3,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
};

export const SESSION_DURATION_DAYS = 30;
export const COOKIE_NAME = "tn_session";
```

- [ ] **Step 5: Set DATABASE_URL in .env.local and run initial migration**

```bash
# Set your Railway PostgreSQL connection string in .env.local first
npx prisma migrate dev --name init
```

Expected: Migration created, tables generated in PostgreSQL.

- [ ] **Step 6: Commit**

```bash
git add prisma/ src/lib/db.ts src/lib/constants.ts
git commit -m "feat: add Prisma schema with all tables and constants"
```

---

## Task 3: Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed config)

- [ ] **Step 1: Install seed dependencies**

```bash
npm install -D tsx
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Write seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed 17 units: 1A on floor 1, then 2A-2D through 5A-5D
  const units: { floor: number; letter: string }[] = [{ floor: 1, letter: "A" }];
  for (let floor = 2; floor <= 5; floor++) {
    for (const letter of ["A", "B", "C", "D"]) {
      units.push({ floor, letter });
    }
  }

  for (const unit of units) {
    const label = `${unit.floor}${unit.letter}`;
    await prisma.unit.upsert({
      where: { label },
      update: {},
      create: {
        floor: unit.floor,
        letter: unit.letter,
        label,
        qrToken: randomBytes(16).toString("hex"),
      },
    });
  }

  // Seed 5 default sections
  const sections = [
    { name: "Maintenance", slug: "maintenance", description: "Report and track maintenance issues", hasIssueTracking: true, sortOrder: 1 },
    { name: "Landlord Issues", slug: "landlord-issues", description: "Document landlord disputes and complaints", hasIssueTracking: true, sortOrder: 2 },
    { name: "Building Bulletins", slug: "bulletins", description: "Announcements, water shutoffs, events", hasIssueTracking: false, sortOrder: 3 },
    { name: "Community", slug: "community", description: "General discussion, selling, lending, recommendations", hasIssueTracking: false, sortOrder: 4 },
    { name: "Safety & Security", slug: "safety", description: "Door locks, suspicious activity, fire safety", hasIssueTracking: true, sortOrder: 5 },
  ];

  for (const section of sections) {
    await prisma.section.upsert({
      where: { slug: section.slug },
      update: {},
      create: section,
    });
  }

  // Seed admin account
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tenantnet.nyc";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme";
  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hash,
    },
  });

  console.log("Seeded 17 units, 5 sections, 1 admin");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 3: Add seed config to package.json**

Add to `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Run seed**

```bash
npx prisma db seed
```

Expected: "Seeded 17 units, 5 sections, 1 admin"

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed script for units, sections, and admin"
```

---

## Task 4: Auth Library

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Install cookie dependency**

```bash
npm install jose
```

We'll use `jose` for signing session tokens (lightweight, edge-compatible). Alternatively, we can use raw `crypto` for HMAC — but `jose` is cleaner for JWTs if we want them later.

Actually, keep it simpler — we'll use plain random tokens stored in the DB, no JWTs. Just need `cookies()` from Next.js.

- [ ] **Step 2: Write auth helpers**

Create `src/lib/auth.ts`:

```typescript
import { cookies } from "next/headers";
import { prisma } from "./db";
import { COOKIE_NAME, SESSION_DURATION_DAYS } from "./constants";
import { randomBytes } from "crypto";

export type SessionData =
  | { type: "unit"; unitId: string; unitLabel: string }
  | { type: "admin"; adminId: string; email: string }
  | null;

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { unit: true, admin: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  if (session.unit) {
    return { type: "unit", unitId: session.unit.id, unitLabel: session.unit.label };
  }
  if (session.admin) {
    return { type: "admin", adminId: session.admin.id, email: session.admin.email };
  }
  return null;
}

export async function requireUnit() {
  const session = await getSession();
  if (!session || session.type !== "unit") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createUnitSession(unitId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: { unitId, token, expiresAt },
  });

  return token;
}

export async function createAdminSession(adminId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: { adminId, token, expiresAt },
  });

  return token;
}

export function setSessionCookie(token: string) {
  // Returns cookie options — caller sets the cookie
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add session auth helpers for unit and admin login"
```

---

## Task 5: QR Auth Flow

**Files:**
- Create: `src/app/auth/[token]/page.tsx`

- [ ] **Step 1: Build the QR auth page**

Create `src/app/auth/[token]/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createUnitSession, setSessionCookie } from "@/lib/auth";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const unit = await prisma.unit.findUnique({
    where: { qrToken: token },
  });

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
          <p className="text-gray-600">
            This QR code is no longer valid. It may have been rotated by your building admin.
            Please scan the new QR code on your door.
          </p>
        </div>
      </div>
    );
  }

  const sessionToken = await createUnitSession(unit.id);
  const cookie = setSessionCookie(sessionToken);
  const cookieStore = await cookies();
  cookieStore.set(cookie);

  redirect("/dashboard");
}
```

- [ ] **Step 2: Verify by visiting /auth/[a-seed-token] in browser**

```bash
npx prisma studio
```

Look up a unit's `qr_token` value, then visit `http://localhost:3000/auth/{that_token}`. Expected: redirects to `/dashboard` (which will 404 for now — that's fine, the redirect proves auth works).

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/
git commit -m "feat: add QR code auth flow — scan token, create session, redirect"
```

---

## Task 6: Tenant Dashboard

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/post-card.tsx`
- Create: `src/components/status-badge.tsx`
- Create: `src/components/section-nav.tsx`

- [ ] **Step 1: Create status badge component**

Create `src/components/status-badge.tsx`:

```typescript
import { STATUS_COLORS } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-800" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {status}
    </span>
  );
}
```

- [ ] **Step 2: Create post card component**

Create `src/components/post-card.tsx`:

```typescript
import Link from "next/link";
import { StatusBadge } from "./status-badge";

type PostCardProps = {
  id: string;
  title: string;
  body: string;
  authorLabel: string;
  sectionName: string;
  status: string | null;
  isPinned: boolean;
  createdAt: Date;
  commentCount: number;
  imageCount: number;
};

export function PostCard({
  id,
  title,
  body,
  authorLabel,
  sectionName,
  status,
  isPinned,
  createdAt,
  commentCount,
  imageCount,
}: PostCardProps) {
  return (
    <Link href={`/post/${id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isPinned && <span className="text-xs text-amber-600 font-medium">PINNED</span>}
              <span className="text-xs text-gray-500">{sectionName}</span>
            </div>
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{body}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{authorLabel}</span>
              <span>{createdAt.toLocaleDateString()}</span>
              {commentCount > 0 && <span>{commentCount} comments</span>}
              {imageCount > 0 && <span>{imageCount} photos</span>}
            </div>
          </div>
          {status && <StatusBadge status={status} />}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create section nav component**

Create `src/components/section-nav.tsx`:

```typescript
import Link from "next/link";

type SectionNavProps = {
  sections: { name: string; slug: string }[];
};

const SECTION_ICONS: Record<string, string> = {
  maintenance: "🔧",
  "landlord-issues": "⚠️",
  bulletins: "📋",
  community: "🏘️",
  safety: "🔒",
};

export function SectionNav({ sections }: SectionNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((section) => (
        <Link
          key={section.slug}
          href={`/section/${section.slug}`}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm hover:border-gray-300 transition-colors"
        >
          <span>{SECTION_ICONS[section.slug] || "📌"}</span>
          <span>{section.name}</span>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Build the dashboard page**

Create `src/app/dashboard/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { SectionNav } from "@/components/section-nav";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.type !== "unit") redirect("/");

  const [unitIssues, recentPosts, pinnedBulletins, sections] = await Promise.all([
    prisma.post.findMany({
      where: {
        unitId: session.unitId,
        status: { not: null },
      },
      include: {
        section: true,
        _count: { select: { comments: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.post.findMany({
      include: {
        section: true,
        unit: true,
        admin: true,
        _count: { select: { comments: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.post.findMany({
      where: {
        isPinned: true,
        section: { slug: "bulletins" },
      },
      include: {
        section: true,
        unit: true,
        admin: true,
        _count: { select: { comments: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.section.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  function authorLabel(post: { unit?: { label: string } | null; admin?: { email: string } | null }) {
    if (post.admin) return "Building Admin";
    if (post.unit) return `Unit ${post.unit.label}`;
    return "Unknown";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">TENANTNET.NYC</h1>
          <span className="text-sm text-gray-500">Unit {session.unitLabel}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Pinned Bulletins */}
        {pinnedBulletins.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">📋 Pinned Bulletins</h2>
            <div className="space-y-2">
              {pinnedBulletins.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  authorLabel={authorLabel(post)}
                  sectionName={post.section.name}
                  status={post.status}
                  isPinned={post.isPinned}
                  createdAt={post.createdAt}
                  commentCount={post._count.comments}
                  imageCount={post._count.images}
                />
              ))}
            </div>
          </section>
        )}

        {/* Your Issues */}
        {unitIssues.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Your Open Issues</h2>
            <div className="space-y-2">
              {unitIssues.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  authorLabel={`Unit ${session.unitLabel}`}
                  sectionName={post.section.name}
                  status={post.status}
                  isPinned={post.isPinned}
                  createdAt={post.createdAt}
                  commentCount={post._count.comments}
                  imageCount={post._count.images}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sections */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Sections</h2>
          <SectionNav sections={sections} />
        </section>

        {/* Recent Posts */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Posts</h2>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                body={post.body}
                authorLabel={authorLabel(post)}
                sectionName={post.section.name}
                status={post.status}
                isPinned={post.isPinned}
                createdAt={post.createdAt}
                commentCount={post._count.comments}
                imageCount={post._count.images}
              />
            ))}
            {recentPosts.length === 0 && (
              <p className="text-sm text-gray-500">No posts yet. Be the first!</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Verify dashboard renders**

Visit `http://localhost:3000/auth/{token}` — should redirect to `/dashboard` showing the empty state with section links.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/ src/components/
git commit -m "feat: add tenant dashboard with post cards, status badges, section nav"
```

---

## Task 7: Section Feed Page

**Files:**
- Create: `src/app/section/[slug]/page.tsx`

- [ ] **Step 1: Build the section page**

Create `src/app/section/[slug]/page.tsx`:

```typescript
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { PostStatus } from "@prisma/client";

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.type !== "unit") redirect("/");

  const { slug } = await params;
  const { status: filterStatus } = await searchParams;

  const section = await prisma.section.findUnique({ where: { slug } });
  if (!section) notFound();

  const where: Record<string, unknown> = { sectionId: section.id };
  if (filterStatus && section.hasIssueTracking) {
    where.status = filterStatus as PostStatus;
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      unit: true,
      admin: true,
      section: true,
      _count: { select: { comments: true, images: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  function authorLabel(post: { unit?: { label: string } | null; admin?: { email: string } | null }) {
    if (post.admin) return "Building Admin";
    if (post.unit) return `Unit ${post.unit.label}`;
    return "Unknown";
  }

  const statuses = ["all", "reported", "acknowledged", "fixed", "unresolved"];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
            <h1 className="text-lg font-bold text-gray-900">{section.name}</h1>
          </div>
          <span className="text-sm text-gray-500">Unit {session.unitLabel}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          {section.hasIssueTracking && (
            <div className="flex gap-1">
              {statuses.map((s) => (
                <Link
                  key={s}
                  href={s === "all" ? `/section/${slug}` : `/section/${slug}?status=${s}`}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    (s === "all" && !filterStatus) || filterStatus === s
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          )}
          <Link
            href={`/new-post?section=${slug}`}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            New Post
          </Link>
        </div>

        <div className="space-y-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              body={post.body}
              authorLabel={authorLabel(post)}
              sectionName={post.section.name}
              status={post.status}
              isPinned={post.isPinned}
              createdAt={post.createdAt}
              commentCount={post._count.comments}
              imageCount={post._count.images}
            />
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No posts in this section yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Visit `/section/maintenance` while authenticated. Expected: empty state with "New Post" button and status filters.

- [ ] **Step 3: Commit**

```bash
git add src/app/section/
git commit -m "feat: add section feed page with status filtering"
```

---

## Task 8: Post Creation

**Files:**
- Create: `src/app/new-post/page.tsx`
- Create: `src/components/image-upload.tsx`
- Create: `src/app/api/posts/route.ts`
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: Install Vercel Blob**

```bash
npm install @vercel/blob
```

- [ ] **Step 2: Create image upload API route**

Create `src/app/api/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { IMAGE_LIMITS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!IMAGE_LIMITS.acceptedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > IMAGE_LIMITS.maxSizeBytes) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
```

- [ ] **Step 3: Create post creation API route**

Create `src/app/api/posts/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IMAGE_LIMITS } from "@/lib/constants";
import { PostStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "unit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, sectionId, content, imageUrls } = body as {
    title: string;
    sectionId: string;
    content: string;
    imageUrls: string[];
  };

  if (!title?.trim() || !sectionId || !content?.trim()) {
    return NextResponse.json({ error: "Title, section, and content are required" }, { status: 400 });
  }

  if (imageUrls && imageUrls.length > IMAGE_LIMITS.maxPerPost) {
    return NextResponse.json({ error: `Max ${IMAGE_LIMITS.maxPerPost} images per post` }, { status: 400 });
  }

  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const post = await prisma.post.create({
    data: {
      title: title.trim(),
      body: content.trim(),
      sectionId,
      unitId: session.unitId,
      status: section.hasIssueTracking ? PostStatus.reported : null,
      images: imageUrls?.length
        ? { create: imageUrls.map((url: string) => ({ url })) }
        : undefined,
    },
  });

  return NextResponse.json({ id: post.id });
}
```

- [ ] **Step 4: Create image upload client component**

Create `src/components/image-upload.tsx`:

```typescript
"use client";

import { useState } from "react";
import { IMAGE_LIMITS } from "@/lib/constants";

type ImageUploadProps = {
  maxImages: number;
  onImagesChange: (urls: string[]) => void;
};

export function ImageUpload({ maxImages, onImagesChange }: ImageUploadProps) {
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (urls.length + files.length > maxImages) {
      alert(`Max ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      if (!IMAGE_LIMITS.acceptedTypes.includes(file.type)) {
        alert(`${file.name}: invalid file type`);
        continue;
      }
      if (file.size > IMAGE_LIMITS.maxSizeBytes) {
        alert(`${file.name}: file too large (max 10MB)`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        newUrls.push(data.url);
      }
    }

    const updated = [...urls, ...newUrls];
    setUrls(updated);
    onImagesChange(updated);
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    const updated = urls.filter((_, i) => i !== index);
    setUrls(updated);
    onImagesChange(updated);
  }

  return (
    <div>
      {urls.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {urls.map((url, i) => (
            <div key={url} className="relative w-20 h-20">
              <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {urls.length < maxImages && (
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer hover:border-gray-300 transition-colors">
          <span>{uploading ? "Uploading..." : "Add Photos"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Build the new post page**

Create `src/app/new-post/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { IMAGE_LIMITS } from "@/lib/constants";

type Section = { id: string; name: string; slug: string; hasIssueTracking: boolean };

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSection = searchParams.get("section");

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/sections")
      .then((r) => r.json())
      .then((data) => {
        setSections(data);
        if (preselectedSection) {
          const match = data.find((s: Section) => s.slug === preselectedSection);
          if (match) setSectionId(match.id);
        }
      });
  }, [preselectedSection]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sectionId || !content.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, sectionId, content, imageUrls }),
    });

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/post/${id}`);
    } else {
      setSubmitting(false);
      alert("Failed to create post");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-lg font-bold text-gray-900">New Post</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="What's the issue or topic?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Describe the situation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
            <ImageUpload maxImages={IMAGE_LIMITS.maxPerPost} onImagesChange={setImageUrls} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white text-sm py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Add sections API for the dropdown**

Create `src/app/api/sections/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const sections = await prisma.section.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, hasIssueTracking: true },
  });
  return NextResponse.json(sections);
}
```

- [ ] **Step 7: Verify post creation flow in browser**

Navigate to `/new-post`, fill in the form, submit. Expected: redirects to `/post/{id}` (will 404 — that's the next task). Check database for the new post row.

- [ ] **Step 8: Commit**

```bash
git add src/app/new-post/ src/app/api/posts/ src/app/api/upload/ src/app/api/sections/ src/components/image-upload.tsx
git commit -m "feat: add post creation with image upload"
```

---

## Task 9: Single Post & Comments

**Files:**
- Create: `src/app/post/[id]/page.tsx`
- Create: `src/components/comment-form.tsx`
- Create: `src/app/api/comments/route.ts`

- [ ] **Step 1: Create comment API route**

Create `src/app/api/comments/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IMAGE_LIMITS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "unit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { postId, content, imageUrls } = body as {
    postId: string;
    content: string;
    imageUrls: string[];
  };

  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: "Post ID and content are required" }, { status: 400 });
  }

  if (imageUrls && imageUrls.length > IMAGE_LIMITS.maxPerComment) {
    return NextResponse.json({ error: `Max ${IMAGE_LIMITS.maxPerComment} images per comment` }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      unitId: session.unitId,
      body: content.trim(),
      images: imageUrls?.length
        ? { create: imageUrls.map((url: string) => ({ url })) }
        : undefined,
    },
  });

  return NextResponse.json({ id: comment.id });
}
```

- [ ] **Step 2: Create comment form client component**

Create `src/components/comment-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./image-upload";
import { IMAGE_LIMITS } from "@/lib/constants";

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content, imageUrls }),
    });

    if (res.ok) {
      setContent("");
      setImageUrls([]);
      setSubmitting(false);
      router.refresh();
    } else {
      setSubmitting(false);
      alert("Failed to post comment");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        required
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        placeholder="Add a comment..."
      />
      <ImageUpload maxImages={IMAGE_LIMITS.maxPerComment} onImagesChange={setImageUrls} />
      <button
        type="submit"
        disabled={submitting}
        className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? "Posting..." : "Comment"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Build the single post page**

Create `src/app/post/[id]/page.tsx`:

```typescript
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { CommentForm } from "@/components/comment-form";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.type !== "unit") redirect("/");

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      section: true,
      unit: true,
      admin: true,
      images: { orderBy: { createdAt: "asc" } },
      comments: {
        include: {
          unit: true,
          images: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) notFound();

  const authorLabel = post.admin
    ? "Building Admin"
    : post.unit
      ? `Unit ${post.unit.label}`
      : "Unknown";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href={`/section/${post.section.slug}`} className="text-gray-400 hover:text-gray-600">←</Link>
          <span className="text-sm text-gray-500">{post.section.name}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Post */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{authorLabel}</span>
                <span>·</span>
                <span>{post.createdAt.toLocaleDateString()}</span>
                {post.isPinned && <span className="text-amber-600 font-medium">PINNED</span>}
              </div>
            </div>
            {post.status && <StatusBadge status={post.status} />}
          </div>

          <p className="text-gray-700 whitespace-pre-wrap">{post.body}</p>

          {post.images.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {post.images.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                  <img src={img.url} alt="" className="w-32 h-32 object-cover rounded-lg" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
          </h2>

          {post.comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                <span className="font-medium text-gray-600">Unit {comment.unit.label}</span>
                <span>·</span>
                <span>{comment.createdAt.toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
              {comment.images.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {comment.images.map((img) => (
                    <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt="" className="w-24 h-24 object-cover rounded-lg" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comment form */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <CommentForm postId={post.id} />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Verify full flow in browser**

Create a post via `/new-post`, verify it redirects to `/post/{id}`, add a comment, verify it appears.

- [ ] **Step 5: Commit**

```bash
git add src/app/post/ src/app/api/comments/ src/components/comment-form.tsx
git commit -m "feat: add single post page with comments and image display"
```

---

## Task 10: Admin Login

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/api/auth/admin/route.ts`

- [ ] **Step 1: Create admin login API route**

Create `src/app/api/auth/admin/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAdminSession, setSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createAdminSession(admin.id);
  const cookie = setSessionCookie(token);
  const cookieStore = await cookies();
  cookieStore.set(cookie);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Build admin login page**

Create `src/app/admin/login/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white text-sm py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify admin login flow**

Visit `/admin/login`, enter seed credentials, verify redirect to `/admin`.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/login/ src/app/api/auth/
git commit -m "feat: add admin email/password login"
```

---

## Task 11: Admin Dashboard

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin-nav.tsx`

- [ ] **Step 1: Create admin nav component**

Create `src/components/admin-nav.tsx`:

```typescript
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/units", label: "Units" },
  { href: "/admin/sections", label: "Sections" },
  { href: "/admin/moderation", label: "Moderation" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <nav className="flex gap-1 mb-6">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            current === item.href
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Build admin dashboard page**

Create `src/app/admin/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.type !== "admin") redirect("/admin/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [openIssues, postsToday, totalPosts, recentPosts] = await Promise.all([
    prisma.post.count({
      where: { status: { in: ["reported", "acknowledged"] } },
    }),
    prisma.post.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.post.count(),
    prisma.post.findMany({
      include: { section: true, unit: true, admin: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900">TENANTNET.NYC Admin</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AdminNav current="/admin" />

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{openIssues}</div>
            <div className="text-xs text-gray-500 mt-1">Open Issues</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{postsToday}</div>
            <div className="text-xs text-gray-500 mt-1">Posts Today</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalPosts}</div>
            <div className="text-xs text-gray-500 mt-1">Total Posts</div>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {recentPosts.map((post) => (
            <div key={post.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">{post.title}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {post.admin ? "Building Admin" : post.unit ? `Unit ${post.unit.label}` : "Unknown"}
                  {" · "}{post.section.name}
                </span>
              </div>
              <span className="text-xs text-gray-400">{post.createdAt.toLocaleDateString()}</span>
            </div>
          ))}
          {recentPosts.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No activity yet</div>
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify admin dashboard**

Log in at `/admin/login`, verify `/admin` shows stats and recent activity.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx src/components/admin-nav.tsx
git commit -m "feat: add admin dashboard with stats and recent activity"
```

---

## Task 12: Admin Unit Management & QR Codes

**Files:**
- Create: `src/app/admin/units/page.tsx`
- Create: `src/app/api/admin/units/[id]/rotate/route.ts`

- [ ] **Step 1: Install QR code package**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Create QR rotation API route**

Create `src/app/api/admin/units/[id]/rotate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const newToken = randomBytes(16).toString("hex");

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { unitId: id } }),
    prisma.unit.update({
      where: { id },
      data: { qrToken: newToken, qrTokenCreatedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ qrToken: newToken });
}
```

- [ ] **Step 3: Build admin units page**

Create `src/app/admin/units/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin-nav";
import QRCode from "qrcode";

type Unit = {
  id: string;
  floor: number;
  letter: string;
  label: string;
  qrToken: string;
  _count: { posts: number; comments: number };
};

export default function AdminUnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [rotating, setRotating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/units")
      .then((r) => r.json())
      .then(setUnits);
  }, []);

  async function generateQR(token: string, unitId: string) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/auth/${token}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 });
    setQrImages((prev) => ({ ...prev, [unitId]: dataUrl }));
  }

  async function rotateToken(unitId: string) {
    if (!confirm("Rotate QR code? This will log out the current tenant and invalidate the old code.")) return;

    setRotating(unitId);
    const res = await fetch(`/api/admin/units/${unitId}/rotate`, { method: "POST" });
    if (res.ok) {
      const { qrToken } = await res.json();
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, qrToken } : u))
      );
      setQrImages((prev) => {
        const next = { ...prev };
        delete next[unitId];
        return next;
      });
    }
    setRotating(null);
  }

  const floors = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900">TENANTNET.NYC Admin</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AdminNav current="/admin/units" />

        {floors.map((floor) => {
          const floorUnits = units.filter((u) => u.floor === floor);
          if (floorUnits.length === 0) return null;

          return (
            <div key={floor} className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Floor {floor}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {floorUnits.map((unit) => (
                  <div key={unit.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">Unit {unit.label}</span>
                      <span className="text-xs text-gray-400">
                        {unit._count.posts} posts · {unit._count.comments} comments
                      </span>
                    </div>

                    {qrImages[unit.id] && (
                      <div className="mb-3 text-center">
                        <img src={qrImages[unit.id]} alt={`QR for Unit ${unit.label}`} className="inline-block w-48 h-48" />
                        <a
                          href={qrImages[unit.id]}
                          download={`qr-unit-${unit.label}.png`}
                          className="block text-xs text-blue-600 mt-1 hover:underline"
                        >
                          Download PNG
                        </a>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => generateQR(unit.qrToken, unit.id)}
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        {qrImages[unit.id] ? "Refresh QR" : "Show QR"}
                      </button>
                      <button
                        onClick={() => rotateToken(unit.id)}
                        disabled={rotating === unit.id}
                        className="flex-1 text-xs border border-red-200 text-red-600 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {rotating === unit.id ? "Rotating..." : "Rotate QR"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Add admin units list API**

Create `src/app/api/admin/units/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const units = await prisma.unit.findMany({
    orderBy: [{ floor: "asc" }, { letter: "asc" }],
    include: {
      _count: { select: { posts: true, comments: true } },
    },
  });

  return NextResponse.json(units);
}
```

- [ ] **Step 5: Verify QR generation and rotation**

Log in as admin, visit `/admin/units`. Click "Show QR" on a unit, verify QR renders. Click "Rotate QR", verify confirmation dialog and new token generated.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/units/ src/app/api/admin/units/
git commit -m "feat: add admin unit management with QR generation and rotation"
```

---

## Task 13: Admin Moderation

**Files:**
- Create: `src/app/admin/moderation/page.tsx`
- Create: `src/app/api/admin/posts/[id]/route.ts`
- Create: `src/app/api/admin/comments/[id]/route.ts`

- [ ] **Step 1: Create admin post management API**

Create `src/app/api/admin/posts/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if ("isPinned" in body) data.isPinned = body.isPinned;
  if ("status" in body) data.status = body.status as PostStatus;

  const post = await prisma.post.update({ where: { id }, data });
  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create admin comment delete API**

Create `src/app/api/admin/comments/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Build admin moderation page**

Create `src/app/admin/moderation/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { POST_STATUS } from "@/lib/constants";

type Post = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  status: string | null;
  createdAt: string;
  section: { name: string; slug: string; hasIssueTracking: boolean };
  unit: { label: string } | null;
  admin: { email: string } | null;
};

export default function AdminModerationPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [bulletinTitle, setBulletinTitle] = useState("");
  const [bulletinBody, setBulletinBody] = useState("");
  const [bulletinSectionId, setBulletinSectionId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/posts").then((r) => r.json()).then(setPosts);
    fetch("/api/sections").then((r) => r.json()).then((data) => {
      setSections(data);
      const bulletins = data.find((s: { slug: string }) => s.slug === "bulletins");
      if (bulletins) setBulletinSectionId(bulletins.id);
    });
  }, []);

  async function togglePin(postId: string, current: boolean) {
    await fetch(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !current }),
    });
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isPinned: !current } : p)));
  }

  async function updateStatus(postId: string, status: string) {
    await fetch(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status } : p)));
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function createBulletin(e: React.FormEvent) {
    e.preventDefault();
    if (!bulletinTitle.trim() || !bulletinBody.trim()) return;
    setCreating(true);

    await fetch("/api/admin/bulletin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bulletinTitle,
        content: bulletinBody,
        sectionId: bulletinSectionId,
      }),
    });

    setBulletinTitle("");
    setBulletinBody("");
    setCreating(false);
    // Refresh posts
    fetch("/api/admin/posts").then((r) => r.json()).then(setPosts);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900">TENANTNET.NYC Admin</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AdminNav current="/admin/moderation" />

        {/* Create Bulletin */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Create Bulletin</h2>
          <form onSubmit={createBulletin} className="space-y-3">
            <input
              type="text"
              value={bulletinTitle}
              onChange={(e) => setBulletinTitle(e.target.value)}
              placeholder="Bulletin title"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={bulletinBody}
              onChange={(e) => setBulletinBody(e.target.value)}
              placeholder="Bulletin content"
              required
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {creating ? "Posting..." : "Post Bulletin"}
            </button>
          </form>
        </div>

        {/* Posts list */}
        <h2 className="text-sm font-semibold text-gray-900 mb-3">All Posts</h2>
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{post.title}</h3>
                  <div className="text-xs text-gray-400 mt-1">
                    {post.admin ? "Building Admin" : post.unit ? `Unit ${post.unit.label}` : "Unknown"}
                    {" · "}{post.section.name}
                    {" · "}{new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePin(post.id, post.isPinned)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      post.isPinned
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {post.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {post.section.hasIssueTracking && post.status && (
                <div className="flex gap-1 mt-3">
                  {POST_STATUS.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(post.id, s)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        post.status === s
                          ? "bg-gray-900 text-white"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Add admin posts list API and bulletin creation API**

Create `src/app/api/admin/posts/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.post.findMany({
    include: { section: true, unit: true, admin: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}
```

Create `src/app/api/admin/bulletin/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, sectionId } = await request.json();

  if (!title?.trim() || !content?.trim() || !sectionId) {
    return NextResponse.json({ error: "Title, content, and section required" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      title: title.trim(),
      body: content.trim(),
      sectionId,
      adminId: session.adminId,
      isPinned: false,
    },
  });

  return NextResponse.json({ id: post.id });
}
```

- [ ] **Step 5: Verify moderation features**

Test: create a bulletin, pin/unpin a post, change issue status, delete a post.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/moderation/ src/app/api/admin/posts/ src/app/api/admin/comments/ src/app/api/admin/bulletin/
git commit -m "feat: add admin moderation — pin/delete posts, status changes, bulletins"
```

---

## Task 14: Admin Section Management

**Files:**
- Create: `src/app/admin/sections/page.tsx`
- Create: `src/app/api/admin/sections/route.ts`

- [ ] **Step 1: Create admin sections API**

Create `src/app/api/admin/sections/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, description, hasIssueTracking, sortOrder } = await request.json();

  const section = await prisma.section.update({
    where: { id },
    data: { name, description, hasIssueTracking, sortOrder },
  });

  return NextResponse.json(section);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, slug, description, hasIssueTracking } = await request.json();

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  }

  const maxOrder = await prisma.section.aggregate({ _max: { sortOrder: true } });

  const section = await prisma.section.create({
    data: {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description || "",
      hasIssueTracking: hasIssueTracking || false,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
    },
  });

  return NextResponse.json(section);
}
```

- [ ] **Step 2: Build admin sections page**

Create `src/app/admin/sections/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin-nav";

type Section = {
  id: string;
  name: string;
  slug: string;
  description: string;
  hasIssueTracking: boolean;
  sortOrder: number;
};

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newTracking, setNewTracking] = useState(false);

  useEffect(() => {
    fetch("/api/sections").then((r) => r.json()).then(setSections);
  }, []);

  async function toggleTracking(section: Section) {
    await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: section.id, hasIssueTracking: !section.hasIssueTracking }),
    });
    setSections((prev) =>
      prev.map((s) =>
        s.id === section.id ? { ...s, hasIssueTracking: !s.hasIssueTracking } : s
      )
    );
  }

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) return;

    const res = await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, slug: newSlug, hasIssueTracking: newTracking }),
    });

    if (res.ok) {
      const section = await res.json();
      setSections((prev) => [...prev, section]);
      setNewName("");
      setNewSlug("");
      setNewTracking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900">TENANTNET.NYC Admin</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AdminNav current="/admin/sections" />

        <div className="space-y-2 mb-6">
          {sections.map((section) => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900 text-sm">{section.name}</span>
                <span className="text-xs text-gray-400 ml-2">/{section.slug}</span>
              </div>
              <button
                onClick={() => toggleTracking(section)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  section.hasIssueTracking
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                Issue Tracking: {section.hasIssueTracking ? "ON" : "OFF"}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Add Section</h2>
          <form onSubmit={addSection} className="flex gap-3 items-end flex-wrap">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
              }}
              placeholder="Section name"
              required
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={newTracking}
                onChange={(e) => setNewTracking(e.target.checked)}
              />
              Issue tracking
            </label>
            <button
              type="submit"
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Add
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify section management**

Add a new section, toggle issue tracking on/off.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/sections/ src/app/api/admin/sections/
git commit -m "feat: add admin section management — add sections, toggle issue tracking"
```

---

## Task 15: Landing Page & Root Route

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update root page**

Replace `src/app/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  if (session?.type === "unit") redirect("/dashboard");
  if (session?.type === "admin") redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TENANTNET.NYC</h1>
        <p className="text-gray-600 mb-6">
          449 West 125th Street
        </p>
        <p className="text-sm text-gray-500">
          Scan the QR code on your apartment door to access the building forum.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify redirects**

- Unauthenticated: shows landing page
- Authenticated as unit: redirects to `/dashboard`
- Authenticated as admin: redirects to `/admin`

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add landing page with auth-based redirects"
```

---

## Task 16: Polish & Deploy

**Files:**
- Modify: `src/app/layout.tsx` (metadata, font)
- Create: `.env.example` (if not already done)

- [ ] **Step 1: Update root layout with metadata**

Update `src/app/layout.tsx` — set title to "TENANTNET.NYC", description, and ensure Tailwind is loaded.

- [ ] **Step 2: Add .superpowers to .gitignore if not already**

- [ ] **Step 3: Test full flow end-to-end**

1. Visit `/` — see landing page
2. Visit `/auth/{token}` — redirected to dashboard
3. Create a post in Maintenance — status auto-set to "reported"
4. Comment on the post with a photo
5. Visit `/admin/login` — log in
6. See stats on admin dashboard
7. Show QR code for a unit
8. Pin a post, change status, create a bulletin
9. Verify bulletin appears pinned on tenant dashboard

- [ ] **Step 4: Deploy to Vercel**

```bash
vercel
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL` — Railway PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` — from Vercel Blob storage
- `ADMIN_EMAIL` — admin login email
- `ADMIN_PASSWORD` — admin login password (used by seed only)

- [ ] **Step 5: Run production migration**

```bash
npx prisma migrate deploy
npx prisma db seed
```

- [ ] **Step 6: Connect tenantnet.nyc domain in Vercel dashboard**

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: finalize layout, metadata, and deploy config"
```
