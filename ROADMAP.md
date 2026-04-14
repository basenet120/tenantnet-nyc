# TENANTNET.NYC Roadmap

A living document of features under consideration. Items are grouped by theme,
not strict release order. Each entry captures the **what**, the **why**, and
the **open questions** — implementation specifics belong in design docs once
work is scoped.

---

## Theme: Adaptive Governance

The current platform assumes one structure: a tenant rep moderates, a
management rep observes, and tenants post. Real buildings are more varied.
Some have active tenant associations with officers and committees. Some are
co-ops or condos with formal boards and bylaws. The platform should let each
building **pick the governance model that matches reality** — without
forcing every building into the same shape.

### Tenant Association (TA) Mode

**What:** Optional governance layer for buildings with an organized TA.
Adds officer roles (President, Vice President, Secretary, Treasurer),
committee structures (Maintenance, Safety, Community Outreach, Legal),
and meeting tooling (agendas, minutes, motions, votes).

**Why:** Active TAs already do this work in messy email threads, group chats,
and shared docs. Centralizing it on the building's TENANTNET creates an
institutional memory that survives officer turnover and gives tenants a
clear way to participate.

**Open questions:**
- How do buildings opt in? System admin enables it, or tenant rep can?
- Voting: who's eligible (one per unit? one per registered tenant?
  weighted by lease holder?), what's the threshold for passing motions,
  how is a quorum defined?
- Anonymous votes vs roll-call votes — both have legitimate uses.
- Officer elections — handled in-platform, or just record the result?

### Co-op & Condo Board Mode

**What:** Formal board governance for buildings with co-op shareholders or
condo unit owners. Adds: meeting scheduler with public agendas, motion
tracking with weighted votes (by shares for co-ops, by common interest for
condos), document storage for bylaws / house rules / meeting minutes,
financial dashboards (budget, reserves, special assessments), and integration
with property management companies as a recognized stakeholder role.

**Why:** Co-op and condo boards have **fiduciary duties** that differ from
TAs. They're legally distinct entities with formal voting requirements.
Currently they manage all of this through property management software
(BuildingLink, Cooperator) which is expensive, ugly, and doesn't include
the rank-and-file shareholders/owners as full participants.

**Open questions:**
- Do co-op and condo modes share infrastructure with TA mode, or are they
  separate variants?
- Document storage: where? Vercel Blob is fine for small files, but board
  packages can be 100MB+ PDFs.
- Voting weight: requires storing share counts (co-ops) or common-interest
  percentages (condos) per unit. Where does that data come from — manually
  entered by board, imported from offering plan?
- Property management integration: read-only stakeholder, or can they
  submit reports/bids back?
- Privacy: board executive sessions are confidential. How do we model
  closed-session minutes vs public minutes?

### Modular Role System

**What:** Refactor the current fixed role system (`tenant_rep`, `mgmt_rep`,
`system_admin`) into a permission grant model. Each role is a named bundle
of capabilities (post, comment, moderate, vote, sign documents, etc.).
Buildings choose which roles exist and assign them to admins/units.

**Why:** Hard-coded roles can't represent every governance model. A
permission-based approach lets a Brooklyn co-op board look very different
from a Bronx tenant association without forking the codebase.

**Open questions:**
- Migration path for existing buildings — auto-map current roles to default
  permission bundles.
- UI for building admins to compose their own roles, or only system admin
  can define new role types?
- Audit log requirements grow — who granted what permission to whom, when.

---

## Theme: Documentation & Accountability

The platform's core value is creating a record that holds up. Right now we
record what tenants posted and when. Next we want to record what landlords
**received and saw**.

### Email Open & Read Tracking

**What:** When a report is sent to management or a city agency, embed an
invisible tracking pixel and link wrappers. Record every open event
(timestamp, IP region, user-agent class) and every link click. Display a
read-receipt timeline on the report record: "Opened 3 times — first
2026-04-15 09:12, last 2026-04-16 14:33."

**Why:** Landlords routinely claim they "didn't see the email" or "didn't
know about the issue." A documented open trail destroys that defense in
housing court. This is a small technical change that shifts the legal
balance significantly.

**Open questions:**
- Disclosure: NY law generally permits read receipts but tenants should
  know their report is being tracked. Add a clear notice on the send form.
- Image-blocking email clients (Apple Mail, Outlook with privacy settings)
  defeat pixel tracking. Use link-wrapping as a backup signal.
- Privacy boundary: track recipient opens (they consented by being a
  business contact), don't track CC'd tenants beyond what they expect.
- Storage: open events should live in a `EmailEvent` table tied to the
  outgoing report; design for high write volume from spam-and-pixel
  cycling.

### Report Lifecycle Tracking

**What:** Today, a sent report is fire-and-forget — we send it, then lose
sight of it. Add status tracking to outgoing reports: "Sent → Opened →
Replied → Resolved/Unresolved" with the tenant marking final outcome.
Create a unified inbox for the building showing all in-flight reports
across all tenants.

**Why:** Buildings need to see patterns. If 12 separate units each emailed
management about the same broken intercom and only 3 got a response, that's
visible at a glance — and actionable.

**Open questions:**
- How does "replied" get detected? Inbound email parsing via building's
  reply-to? Or manual mark by the tenant who got the reply?
- Cross-tenant visibility: who can see whose outgoing reports? Tenant rep
  always, original sender always — but other tenants?
- Aggregation across multiple reports about the same issue (a "thread"
  concept).

### Document Vault

**What:** Per-building secure storage for important docs: leases, rent
history requests, DHCR responses, court filings, repair invoices, photos
of conditions over time. Tenant-owned documents are private to the unit;
building-owned documents (bylaws, board minutes, building-wide complaints)
are visible per role.

**Why:** Tenants lose paper records. Court cases require organized evidence.
A vault tied to the building's persistent forum keeps records in one
place, with the timestamps the platform already provides.

**Open questions:**
- Storage cost: PDFs can be large. Vercel Blob has reasonable pricing but
  building usage will scale unpredictably.
- OCR / search: do we extract text from uploaded PDFs to make them
  searchable?
- Sharing controls: can a tenant share a document into a post, or only
  store it privately?

---

## Theme: Privacy & Tenant Comfort

Tenants self-censor when they think their neighbors will see everything.
Some requests are embarrassing (mental health accommodations, hygiene
issues with neighbors, financial hardship). The platform needs gradient
privacy.

### Granular Post Visibility

**What:** Today posts are `public` (all unit + admins) or `private`
(poster + admins). Expand to: **unit-only** (only the poster's household),
**admin-only** (poster + tenant rep, hidden from other tenants), **named
recipients** (specific units the poster picks), and **private draft**
(saved but not yet sent).

**Why:** A leak from the bathroom upstairs is fine to post publicly. A
request for help with a tenant's hoarding situation, or a complaint about
a neighbor's domestic disturbance, needs more privacy. Forcing everything
into "public or fully private" makes the platform unusable for sensitive
issues.

**Open questions:**
- How do we present the privacy choice without making it overwhelming?
  Default to building-public, with a clear "make this private" affordance.
- Anonymous posting (visible to all but no unit attribution) is sometimes
  requested — but it undermines the platform's accountability model.
  Probably skip.
- Search: private posts shouldn't show up in other tenants' searches.

### Tenant-Only Spaces

**What:** Sections (forums-within-forums) that explicitly exclude
management and admin viewing. Tenant rep moderates but management rep
cannot see content. Useful for organizing collective action, discussing
landlord-tenant strategy, or sharing information that shouldn't reach the
landlord's eyes.

**Why:** The current "Management Rep" role is intentionally read-only on
all posts. This is the right default for transparency. But tenants
organizing a rent strike or preparing a class-action complaint need a
space where the landlord's representative literally cannot read what
they're planning.

**Open questions:**
- Section-level permissions vs post-level — pick one model, don't combine.
- Clearly mark tenant-only sections in the UI so people don't accidentally
  share the wrong post in the wrong section.
- What happens during legal discovery? The platform may have to produce
  these records anyway — be honest about that limit.

### Encrypted Direct Messaging

**What:** End-to-end encrypted DMs between any two tenants, or between a
tenant and the tenant rep. The platform server cannot read message
content. Useful for sensitive coordination, accommodation requests, and
rent strike logistics.

**Why:** Tenants currently do this on Signal or Telegram, fragmenting the
record and pulling people off-platform. Bringing it on-platform without
making the platform able to read content gets the best of both worlds.

**Open questions:**
- E2E key management is hard. Web platforms have weak primitives. Maybe
  defer until there's a mobile app and use Signal Protocol.
- Search and archival: by definition, the server can't index encrypted
  content. Users have to maintain their own DM history.
- Compliance: subpoenas can compel platforms to turn over data. E2E means
  we have nothing to turn over — this is a feature, but documenting it
  matters.

---

## Theme: Tenant Community & Mutual Aid

Beyond formal governance and complaints, buildings function as
neighborhoods. The platform can help neighbors actually act like
neighbors.

### Mutual Aid Board

**What:** Lightweight section for non-complaint posts: "I have an extra
A/C unit free to anyone who needs it," "Looking for a babysitter for
Thursday," "Anyone want to organize a hallway potluck?" Different visual
treatment from issue tracking — green/sage tones, no status workflow.

**Why:** Tenants form stronger associations when they know each other as
neighbors, not just complaint-filers. Building social fabric makes
collective action work better when it's needed.

### Skill Exchange / Local Resources

**What:** Per-building directory of opt-in tenant skills (electrician,
nurse, lawyer, translator, plumber, contractor) so neighbors can ask each
other before paying for services. Includes a per-building list of trusted
local resources (laundromat with same-day service, the bodega that
delivers, the locksmith who takes Venmo).

**Why:** Knowledge transfer between long-time tenants and new tenants is
real value that gets lost when people move out. Capturing it is low-cost.

---

## Theme: Operational Excellence

Less glamorous but critical for the platform to scale.

### Multi-Building Tenant Reps

**What:** A tenant rep currently manages one building. Some experienced
organizers manage 3-5 buildings (tenant union staff, neighborhood TA
chairs). Allow a single admin account to manage multiple buildings with
clear scoping.

### Audit Log

**What:** Immutable record of every administrative action: post deletion,
status change, role grant, settings change, QR code rotation. Critical for
trust — tenants need to verify that admins aren't censoring inconvenient
posts.

### Public Building Pages

**What:** Each building gets an opt-in public page (no login required)
showing aggregate stats: "12 active issues, 3 resolved this month, last
HPD inspection 2026-02-14." No personal posts visible. Useful for
prospective tenants researching a building, journalists tracking landlord
patterns, and the building's own organizing efforts ("our building has 47
open complaints — sign the petition").

### Building Comparison & Pattern Detection

**What:** When the same landlord owns multiple buildings on the platform,
surface cross-building patterns: "This landlord's buildings average 15%
more open HPD violations than the borough median." Powerful for
journalists, regulators, and tenant organizers.

---

## Theme: Internationalization & Accessibility

Already partially shipped (5 languages, RTL support). Continued work:

- **More languages**: French (Haitian Creole community), Bengali (Bronx),
  Korean (Queens). Add as building demographics warrant.
- **Spoken-language audio recordings**: many older tenants prefer voice
  notes to typing. Allow voice-recorded post bodies that auto-transcribe
  to text.
- **WCAG 2.2 AA compliance**: full audit and remediation. Many tenants
  have visual or cognitive disabilities and the platform should be
  usable by everyone.
- **Print-friendly views**: tenants take printed records to court. Make
  every post and report printable as a clean PDF with all metadata.
