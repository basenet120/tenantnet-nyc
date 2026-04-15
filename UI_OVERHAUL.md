# UI Overhaul: Design System Recommendation

## TL;DR

**Adopt [shadcn/ui](https://ui.shadcn.com)** as the component layer, keep TENANTNET's
existing "urban civic brutalist" color palette and typography. Layer in a few
opinionated components from [neobrutalism.dev](https://www.neobrutalism.dev)
where the brutalist aesthetic needs to be louder (hero CTAs, status badges,
stat cards).

This isn't a visual rewrite. It's swapping hand-rolled primitives for a mature,
accessible component library while preserving the existing look.

## Research (via Tavily, April 2026)

| Library | GitHub ⭐ | Last push | Fit | Notes |
|---|---|---|---|---|
| **shadcn/ui** | 112,349 | 2026-04-14 | ✅ Best | Industry standard. Tailwind v4 native. Radix primitives. Components copy into your codebase — you own them. |
| Flowbite | 9,195 | 2026-04-03 | ⚠️ Mismatch | Comprehensive but its visual language is too "SaaS dashboard." Hard to retheme to brutalist. |
| Neobrutalism components | ~4,300 | recent | ✅ Pair with shadcn | Built ON shadcn/ui. Drop-in neobrutalist theme: thick borders, bold colors, hard shadows. |
| TailGrids | 1,534 | 2026-04-14 | ⚠️ Skip | Generic corporate UI kit. Unnecessary given shadcn. |
| seraui | 1,287 | 2026-02-18 | ⚠️ Skip | Newer, motion-focused, smaller ecosystem. |
| brutalist-ui | 8 | 2026-03-28 | ❌ Too small | Only 8 stars, one maintainer. Risky for production. |
| Tailwind Plus | N/A | commercial | ❌ Paid | $299 license. Beautiful but closed-source. |

## Why shadcn/ui

### Fits the current stack exactly
- **Next.js 16 App Router** ✓ (shadcn's primary recommended framework)
- **Tailwind v4** ✓ (first-class support)
- **React 19 / Server Components** ✓
- **TypeScript** ✓
- **CSS variable theming** ✓ — maps directly onto TENANTNET's existing
  `--color-charcoal`, `--color-terracotta`, `--color-offwhite` system

### Solves pain points we've been grinding on
| Problem encountered in this project | shadcn primitive |
|---|---|
| Language picker dropdown went through 5+ positioning rewrites | `<DropdownMenu>` (Radix, handles portaling, outside clicks, focus) |
| Hand-rolled QR rotate confirm modal in admin/units | `<AlertDialog>` |
| Rent stabilization notice modal in components/ | `<Dialog>` |
| Density selector as custom button group | `<ToggleGroup>` |
| Building switcher dropdown with search | `<Command>` (cmdk — search with keyboard nav built in) |
| Status filter pills on /section/[slug] | `<Tabs>` or `<ToggleGroup>` |
| Moderation status picker | `<Select>` |
| Language picker itself | `<Select>` or `<DropdownMenu>` |
| Form validation (register, new-post, settings) | `<Form>` with react-hook-form + zod |
| Tooltip text nowhere in the app today | `<Tooltip>` |
| Notification/bulletin highlighting | `<Alert>` |

### Accessibility out of the box
TENANTNET serves tenants — including elderly, disabled, non-English-speaking
users. Radix primitives give us:
- Correct ARIA roles/attributes
- Keyboard navigation (arrow keys in menus, tab order, escape to close)
- Focus management (trap focus in modals, return to trigger)
- Screen-reader announcements for toasts, dialogs, status changes

Building this correctly by hand takes weeks per primitive. We've been cutting
corners — for example, the confirm-delete button in ModerationToolbar is a
plain `<button>` with a stateful flag, not a real `AlertDialog`.

### Preserves what we have
- Our color palette → drop into shadcn's CSS variable theme
- Archivo Black display font → override `--font-display`
- Brutalist borders (2px, hard corners) → shadcn's default supports this with
  `--radius: 0` and 2px borders via utility classes
- Existing `.card`, `.btn-primary`, `.badge-*` utilities → keep them, just
  progressively replace internals

## The Brutalist Look-and-Feel

shadcn out of the box is minimal/neutral. We have two ways to keep our
aesthetic:

1. **Retheme shadcn directly** — set CSS variables, hard corners (`--radius: 0`),
   2px borders, our color palette. This is enough for 90% of components.

2. **Use neobrutalism.dev components** selectively for callouts:
   - Hero CTAs on the landing page
   - Status badges (Open Issues / Reported / Fixed)
   - Stat cards on dashboards
   These have thick 4px borders, hard shadows (shadow-[4px_4px_0_#000]),
   and bold colors — perfect for high-stakes civic UI moments.

## What Changes, What Doesn't

### Replace (internals only, not visual identity)
- `src/components/language-picker.tsx` → shadcn `DropdownMenu`
- `src/components/building-switcher.tsx` → shadcn `Command` (better search)
- `src/components/rent-stabilized-notice.tsx` modal wrapper → shadcn `Dialog`
- `src/components/moderation-toolbar.tsx` status picker → shadcn `Select`
- `src/app/admin/units/page.tsx` ConfirmModal → shadcn `AlertDialog`
- `src/app/admin/units/page.tsx` density selector → shadcn `ToggleGroup`
- `src/app/section/[slug]/page.tsx` status pills → shadcn `ToggleGroup`
- Register/new-post/settings forms → shadcn `Form` + zod validation

### Keep (no reason to touch)
- All i18n infrastructure (I18nProvider, AdminI18nProvider, prewarm script)
- Navigation structure (breadcrumb, footer, admin-nav, system-admin-nav)
- Color palette and fonts
- Page-level layout and content
- All API routes
- Database schema and Prisma setup
- Existing translation keys
- The favicon we just made

### Probably refactor later (scope creep risk)
- The whole moderation page as a shadcn `DataTable` with sorting/filtering
- Onboarding wizard as shadcn `Stepper` pattern
- Building records browser tabs as shadcn `Tabs`

## Migration Plan (if approved)

### Phase 1: Setup (1 commit)
1. `npx shadcn@latest init` — configures components.json, utils, tailwind
2. Map our CSS variables into shadcn's theme
3. Install base primitives: `button`, `card`, `dialog`, `dropdown-menu`,
   `select`, `toggle-group`, `tooltip`, `alert`

### Phase 2: High-value swaps (2–3 commits)
Each swap is small, testable, and shippable independently:
- Replace language picker with `DropdownMenu` (fixes the positioning saga)
- Replace QR rotate confirm with `AlertDialog` (accessible)
- Replace rent notice outer wrapper with `Dialog` (focus trap)
- Replace moderation status picker with `Select`

### Phase 3: Lower-value polish (as desired)
- Form primitives for register/settings
- `Command` palette for building switcher
- `ToggleGroup` for density and status pills
- `Alert` for pinned bulletins and the rent-stabilized notice's step list
- `Tooltip` for icon-only buttons

### Phase 4: Optional brutalist flourishes
Drop in neobrutalism.dev styles for:
- Landing page hero CTA
- Post status badges
- Dashboard stat cards

## Risk & Trade-offs

**Adds**:
- ~20 files under `src/components/ui/` (shadcn copies components in)
- New dependencies: `@radix-ui/*` (already battle-tested, small bundles),
  `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`

**Mitigations**:
- Components are vendored, not imported from a package — no version-lock risk
- Can roll back any individual swap without affecting others
- Each component ~3–10KB gzipped; Radix primitives tree-shake well

**Doesn't add**:
- Design lock-in (we own the component code, tweak freely)
- Runtime framework (it's just React + Tailwind)
- Breaking changes to APIs or database

## Recommendation

Start Phase 1 + Phase 2 on this branch (`ui-overhaul-shadcn`). Ship the
language picker, confirm dialog, and modal wrapper swaps first — those are
the components that have bitten us the most. Evaluate after that and decide
whether to go deeper.
