# TENANTNET.NYC — Tenant Forum & Issue Tracker

## Overview

A hybrid forum/news platform for 449 West 125th Street, a 17-unit rent-stabilized building in Harlem. Serves two purposes: community building among tenants, and collective documentation of maintenance issues, landlord disputes, and building-wide concerns. Evidence with timestamps and photos is a core feature.

## Building Details

- **Address:** 449 West 125th Street, Harlem, NYC
- **Units:** 17 total — 1 unit on floor 1 (1A), 4 units on floors 2–5 (A–D each)
- **Tenants:** Small building, neighbors mostly know each other

## Architecture

Single Next.js application deployed to Vercel, with PostgreSQL on Railway and image storage on Vercel Blob.

```
Tenant (scans QR) ──→ Vercel (Next.js App Router)
Admin (email login) ──→     │
                            ├── API Routes (auth, posts, comments, images, admin)
                            ├── React Server Components (pages)
                            ├── Vercel Blob (image uploads)
                            └── Railway PostgreSQL
```

## Authentication

### Tenant Auth (QR Code)

Each unit has a unique secret token stored in the database. The QR code (printed as a sticker on the back of the unit's front door) encodes a URL:

```
https://tenantnet.nyc/auth/{qr_token}
```

**Flow:**
1. Tenant scans QR code on their door
2. `GET /auth/[token]` validates token against `units.qr_token`
3. Server creates a session row, sets an `httpOnly` session cookie (30-day expiry)
4. Redirects to `/dashboard`
5. Subsequent visits read the cookie — no re-scanning needed until expiry

**QR rotation:** Admin can rotate any unit's token from `/admin/units`. This invalidates the old QR code immediately (old token no longer matches). All existing sessions for that unit are also revoked (deleted from `sessions` table). Admin generates and prints a new QR sticker.

**Identity model:** Posts and comments are attributed to the unit ("Unit 3B"), not to individual people. The physical QR code on the door IS the credential — if you live there, you have access.

**Logout:** No explicit logout in V1. Sessions expire after 30 days. QR rotation serves as a forced logout when needed (e.g. tenant moves out).

**Image uploads:** Max 5 images per post, 3 per comment. Max 10MB per file. Accepted types: JPEG, PNG, WebP.

### Admin Auth

Traditional email + password login at `/admin/login`. Single admin account initially; the `admins` table supports adding more later. Admin sessions use the same cookie mechanism but with an `is_admin` flag or separate cookie.

## Data Model

### units
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| floor | int | 1–5 |
| letter | varchar | A–D (floor 1 only has A) |
| label | varchar | Display name, e.g. "3B" |
| qr_token | varchar | Unique, used in QR URL |
| qr_token_created_at | timestamp | For rotation tracking |
| created_at | timestamp | |

### sessions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| unit_id | uuid | FK → units, nullable |
| admin_id | uuid | FK → admins, nullable |
| token | varchar | Stored in cookie |
| expires_at | timestamp | 30 days from creation |
| created_at | timestamp | |

One of `unit_id` or `admin_id` must be set (check constraint). Tenant sessions have `unit_id`, admin sessions have `admin_id`.

### admins
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | varchar | Unique |
| password_hash | varchar | bcrypt |
| created_at | timestamp | |

### sections
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | varchar | Display name |
| slug | varchar | URL-safe, unique |
| description | text | |
| has_issue_tracking | boolean | Enables status field on posts |
| sort_order | int | Display ordering |

**Default sections:**
1. Maintenance (`maintenance`) — issue tracking ON
2. Landlord Issues (`landlord-issues`) — issue tracking ON
3. Building Bulletins (`bulletins`) — issue tracking OFF
4. Community (`community`) — issue tracking OFF
5. Safety & Security (`safety`) — issue tracking ON

### posts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| section_id | uuid | FK → sections |
| unit_id | uuid | FK → units, nullable |
| admin_id | uuid | FK → admins, nullable |
| title | varchar | |
| body | text | |
| is_pinned | boolean | Default false, admin-only |
| status | enum | NULL for non-issue sections. Values: `reported`, `acknowledged`, `fixed`, `unresolved` |
| created_at | timestamp | |
| updated_at | timestamp | For admin status changes only — no tenant editing in V1 |

One of `unit_id` or `admin_id` must be set. Admin-created posts (bulletins) have `admin_id` and display as "Building Admin" instead of a unit label.

### comments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| post_id | uuid | FK → posts |
| unit_id | uuid | FK → units |
| body | text | |
| created_at | timestamp | |

### images
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| post_id | uuid | FK → posts, nullable |
| comment_id | uuid | FK → comments, nullable |
| url | varchar | Vercel Blob URL |
| created_at | timestamp | |

One of `post_id` or `comment_id` must be set (check constraint). Multiple images per post/comment supported — this is a one-to-many relationship.

## Pages

### Tenant Pages

**`/auth/[token]`** — QR landing. Validates token, creates session, redirects to `/dashboard`. Shows error if token is invalid or rotated.

**`/dashboard`** — Unit home page. Shows:
- Welcome header with unit label ("Welcome, Unit 3B")
- Your unit's active issues with current status
- Recent building-wide posts across all sections
- Pinned bulletins
- Quick links to all 5 sections

**`/section/[slug]`** — Section feed. Shows:
- All posts in the section, sorted by pinned first then newest
- Status filter for issue-tracking sections (all / reported / acknowledged / fixed / unresolved)
- "New Post" button

**`/post/[id]`** — Single post view. Shows:
- Full post body with attached images
- Status badge and timeline for issue posts
- Comment thread with images
- "Add comment" form with image upload

**`/new-post`** — Post creation form:
- Section picker (pre-filled if coming from a section page)
- Title and body fields
- Multi-image upload
- Submit

### Admin Pages

**`/admin/login`** — Email + password form.

**`/admin`** — Admin dashboard:
- Building overview with recent activity
- Quick stats (open issues count, posts today, active units)

**`/admin/units`** — Unit management:
- All 17 units listed by floor
- View QR code for each unit (rendered as image)
- Rotate QR code button (with confirmation)
- Activity summary per unit

**`/admin/sections`** — Section management:
- Add, edit, reorder sections
- Toggle issue tracking per section

**`/admin/moderation`** — Content management:
- Pin/unpin and delete posts
- Delete comments
- Update issue statuses — admin can set any status from any state (no enforced linear progression). Common flows: `reported → acknowledged → fixed`, or `reported → unresolved` for landlord neglect
- Create bulletins (posts in the Bulletins section attributed to "Building Admin")

## UI Design

**Direction:** Clean & Minimal — light background, simple cards, generous whitespace. Professional and credible, appropriate for a tool that documents evidence. Not flashy.

**Key traits:**
- White/light gray background, dark text
- Card-based layout with subtle borders
- Status badges as colored pills (yellow=reported, green=acknowledged, blue=fixed, red=unresolved)
- Section icons for quick visual identification
- Mobile-first — tenants will primarily use this on their phones after scanning the QR code
- Tailwind CSS for styling

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma |
| Database | PostgreSQL (Railway) |
| Image storage | Vercel Blob |
| QR generation | `qrcode` npm package |
| Deployment | Vercel |
| Domain | tenantnet.nyc (already on Vercel) |

## Future Considerations (Not in V1)

- **PDF export:** Generate exportable reports of issue timelines with photos for HPD complaints, housing court, or tenant lawyers
- **Notifications:** Email or push when issues get status updates
- **Multi-building support:** If this becomes a product for other buildings
- **311/government integration:** Standardized building-level civic tool
