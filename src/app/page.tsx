import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BuildingSignupForm } from "@/components/building-signup-form";

export default async function Home() {
  const session = await getSession();

  if (session?.type === "unit") {
    redirect("/dashboard");
  }
  if (session?.type === "admin") {
    if (session.role === "system_admin") {
      redirect("/admin/system");
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh">
      {/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-border-light) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-border-light) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Terracotta diagonal accent */}
        <div
          className="absolute -right-32 top-1/4 w-[500px] h-[3px] bg-terracotta opacity-40"
          style={{ transform: "rotate(-35deg)" }}
        />
        <div
          className="absolute -right-24 top-[28%] w-[300px] h-[1px] bg-terracotta opacity-20"
          style={{ transform: "rotate(-35deg)" }}
        />
        <div
          className="absolute -left-32 bottom-1/3 w-[400px] h-[2px] bg-terracotta opacity-25"
          style={{ transform: "rotate(-35deg)" }}
        />

        <div className="container-wide relative">
          <div className="max-w-5xl py-24 sm:py-32">
            {/* Overline */}
            <p
              className="font-display text-[0.6875rem] tracking-[0.25em] uppercase text-[var(--color-text-secondary)] mb-6 animate-in"
            >
              A platform for NYC tenants
            </p>

            {/* Main title */}
            <h1
              className="font-display text-[clamp(3.5rem,10vw,9rem)] uppercase leading-[0.85] tracking-tight text-offwhite mb-0 animate-in stagger-1"
            >
              TENANT
              <br />
              NET<span className="text-terracotta">.NYC</span>
            </h1>

            {/* Subtitle bar */}
            <div className="mt-8 border-l-[3px] border-terracotta pl-5 max-w-xl animate-in stagger-2">
              <p className="text-lg sm:text-xl text-offwhite leading-snug font-medium">
                Your building&apos;s private forum. Report issues. Document disputes.
                Hold landlords accountable. Build community.
              </p>
            </div>

            {/* CTA row */}
            <div className="mt-10 flex flex-wrap gap-4 animate-in stagger-3">
              <Link href="/login" className="btn btn-primary no-underline">
                Log In
              </Link>
              <a href="#how-it-works" className="btn btn-outline no-underline">
                Learn More
              </a>
            </div>

            {/* Quick stat strip */}
            <div className="mt-16 flex flex-wrap gap-10 animate-in stagger-4">
              <div>
                <p className="font-display text-3xl sm:text-4xl text-terracotta">100%</p>
                <p className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mt-1">Free for tenants</p>
              </div>
              <div>
                <p className="font-display text-3xl sm:text-4xl text-offwhite">QR</p>
                <p className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mt-1">Scan to join</p>
              </div>
              <div>
                <p className="font-display text-3xl sm:text-4xl text-offwhite">NYC</p>
                <p className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mt-1">Public records built in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-in stagger-5">
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
            <span className="text-[0.5625rem] uppercase tracking-[0.2em]">Scroll</span>
            <div className="w-[1px] h-8 bg-[var(--color-border-light)] relative overflow-hidden">
              <div
                className="absolute inset-x-0 h-4 bg-terracotta"
                style={{ animation: "scrollPulse 2s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHAT IS TENANTNET
          ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t-2 border-[var(--color-border)]">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20">
            {/* Left: section label */}
            <div>
              <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
                What is this
              </p>
              <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite">
                Your building,
                <br />
                <span className="text-terracotta">organized.</span>
              </h2>
              <p className="mt-6 text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
                TENANTNET.NYC gives every apartment building its own private, timestamped
                forum — so tenants can document problems, coordinate with neighbors,
                and create a paper trail that actually matters.
              </p>
            </div>

            {/* Right: feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[2px] bg-[var(--color-border)]">
              <FeatureCard
                number="01"
                title="Report Issues"
                description="Maintenance problems, safety hazards, lease violations — document everything with photos and timestamps that hold up."
              />
              <FeatureCard
                number="02"
                title="Track Resolution"
                description="Every issue gets a status: reported, acknowledged, fixed, or unresolved. Nothing falls through the cracks."
              />
              <FeatureCard
                number="03"
                title="Build Evidence"
                description="Every post is timestamped and attributed. If it goes to court, you have a documented record of complaints."
              />
              <FeatureCard
                number="04"
                title="Know Your Rights"
                description="Direct links to your building's DOB violations, HPD complaints, ACRIS records, and more — pulled from NYC public databases."
              />
              <FeatureCard
                number="05"
                title="Email Reports"
                description="Send documented complaints directly to your landlord, management company, HPD, or 311 — right from the platform."
              />
              <FeatureCard
                number="06"
                title="Stay Anonymous"
                description="Posts are attributed to unit numbers, not names. Your identity is protected. Organize without fear of retaliation."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 sm:py-28 border-t-2 border-[var(--color-border)] scroll-mt-8">
        <div className="container-wide">
          <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
            How it works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite mb-16">
            Three steps. <span className="text-terracotta">Zero friction.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <StepCard
              step="01"
              title="Get your QR code"
              description="Your building's tenant rep distributes a unique QR code to each unit. Scan it with your phone camera — that's your login. No apps, no downloads, no passwords to remember."
              isFirst
            />
            <StepCard
              step="02"
              title="Post & document"
              description="Report maintenance issues with photos. Flag landlord disputes. Read building bulletins. Comment on your neighbors' posts. Every action is timestamped and preserved."
            />
            <StepCard
              step="03"
              title="Hold them accountable"
              description="Send formal complaints to your landlord or city agencies right from the platform. Access your building's HPD violations, DOB complaints, and public records. Build your case."
              isLast
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHO IT'S FOR
          ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t-2 border-[var(--color-border)]">
        <div className="container-wide">
          <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
            Who it&apos;s for
          </p>
          <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite mb-12">
            Every tenant. <span className="text-terracotta">Every building.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AudienceCard
              label="Rent Stabilized"
              description="Document violations. Build your case for rent overcharges. Know your succession and renewal rights."
            />
            <AudienceCard
              label="Market Rate"
              description="Just because your rent isn't regulated doesn't mean your landlord can ignore repairs. Document everything."
            />
            <AudienceCard
              label="NYCHA / Public"
              description="Track maintenance tickets that NYCHA loses. Coordinate with neighbors on shared building issues."
            />
            <AudienceCard
              label="Co-ops & Condos"
              description="Board transparency. Maintenance coordination. Building-wide communication without the email chain chaos."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          NYC RECORDS CALLOUT
          ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t-2 border-[var(--color-border)] relative overflow-hidden">
        {/* Background accent */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, var(--color-terracotta) 0, var(--color-terracotta) 1px, transparent 0, transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container-wide relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
                NYC public records
              </p>
              <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite mb-6">
                Your building&apos;s history,
                <br />
                <span className="text-terracotta">one click away.</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-md">
                Every building on TENANTNET.NYC gets automatic links to NYC government
                databases. Know what the city knows about your building.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[2px] bg-[var(--color-border)]">
              {[
                { code: "DOB", label: "Building Profile", sub: "Permits & certificates" },
                { code: "HPD", label: "Violations", sub: "Housing code violations" },
                { code: "HPD", label: "Complaints", sub: "Filed complaints" },
                { code: "311", label: "Service Requests", sub: "Noise, heat, pests" },
                { code: "ACRIS", label: "Property Docs", sub: "Deeds & mortgages" },
                { code: "ZoLA", label: "Zoning Info", sub: "Land use & zoning" },
              ].map((record) => (
                <div key={record.label} className="bg-[var(--color-charcoal-light)] p-4">
                  <span className="font-display text-sm text-terracotta tracking-wider">{record.code}</span>
                  <p className="text-sm font-semibold text-offwhite mt-1">{record.label}</p>
                  <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-0.5">{record.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ROLES
          ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t-2 border-[var(--color-border)]">
        <div className="container-wide">
          <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
            Built-in structure
          </p>
          <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite mb-12">
            Roles that <span className="text-terracotta">make sense.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-[var(--color-border)] p-6 relative">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-terracotta" />
              <p className="font-display text-lg uppercase text-offwhite mt-2">Tenant Rep</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">
                The building organizer. Manages units, moderates posts, invites management reps, and sends
                official reports to the landlord and city agencies. Every building gets one.
              </p>
            </div>
            <div className="border-2 border-[var(--color-border)] p-6 relative">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-amber" />
              <p className="font-display text-lg uppercase text-offwhite mt-2">Tenants</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">
                Post issues, upload photo evidence, comment on neighbors&apos; posts, track the status of
                reported problems. Identified by unit number, never by name.
              </p>
            </div>
            <div className="border-2 border-[var(--color-border)] p-6 relative">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-sage" />
              <p className="font-display text-lg uppercase text-offwhite mt-2">Management Rep</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">
                Invited by the tenant rep. Read-only access to all posts, can comment but can&apos;t
                moderate or delete. Transparency without control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          EXISTING TENANT CTA
          ═══════════════════════════════════════════ */}
      <section className="py-16 border-t-2 border-[var(--color-border)]">
        <div className="container-narrow text-center">
          <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-[var(--color-text-secondary)] mb-4">
            Already on TENANTNET.NYC?
          </p>
          <h2 className="font-display text-2xl sm:text-3xl uppercase leading-[0.95] text-offwhite mb-3">
            Scan your QR code <span className="text-terracotta">or log in.</span>
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
            Scan the QR code your tenant rep distributed. Or log in with the
            username and password you created during registration.
          </p>
          <Link href="/login" className="btn btn-primary no-underline">
            Log In
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BUILDING SIGNUP
          ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t-2 border-terracotta relative overflow-hidden">
        {/* Terracotta accent bar top */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-terracotta" />

        <div className="container-narrow">
          <div className="text-center mb-12">
            <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
              Get started
            </p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase leading-[0.9] text-offwhite mb-4">
              Bring TENANTNET
              <br />
              <span className="text-terracotta">to your building.</span>
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-lg mx-auto">
              Whether you&apos;re a tenant organizer, a concerned neighbor, or a tenant
              association — submit your building and we&apos;ll set you up. It&apos;s free.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <BuildingSignupForm />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="border-t-2 border-[var(--color-border)] py-12">
        <div className="container-wide">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="font-display text-lg uppercase tracking-tight text-offwhite">
                TENANTNET<span className="text-terracotta">.NYC</span>
              </span>
              <span className="text-[0.625rem] uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
                By tenants, for tenants.
              </span>
            </div>
            <div className="flex items-center gap-6 text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
              <Link href="/login" className="hover:text-offwhite transition-colors no-underline">Log In</Link>
              <a href="#how-it-works" className="hover:text-offwhite transition-colors no-underline">How It Works</a>
              <Link href="/admin/login" className="hover:text-offwhite transition-colors no-underline">Admin</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll pulse animation */}
      <style>{`
        @keyframes scrollPulse {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

/* ─── Sub-components (server, no separate files needed) ─── */

function FeatureCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-[var(--color-charcoal-light)] p-6 group">
      <span className="font-display text-2xl text-[var(--color-border-light)] group-hover:text-terracotta transition-colors duration-300">
        {number}
      </span>
      <h3 className="font-display text-base uppercase tracking-wide text-offwhite mt-2 mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepCard({ step, title, description, isFirst, isLast }: { step: string; title: string; description: string; isFirst?: boolean; isLast?: boolean }) {
  return (
    <div className={`relative p-8 border-2 border-[var(--color-border)] ${!isLast ? "md:border-r-0" : ""}`}>
      {/* Connector line */}
      {!isFirst && (
        <div className="hidden md:block absolute -left-[2px] top-1/2 -translate-y-1/2 w-[2px] h-8 bg-terracotta" />
      )}
      <span className="font-display text-5xl text-[var(--color-charcoal-lighter)]">{step}</span>
      <h3 className="font-display text-lg uppercase tracking-wide text-offwhite mt-3 mb-3">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function AudienceCard({ label, description }: { label: string; description: string }) {
  return (
    <div className="border-2 border-[var(--color-border)] p-5 hover:border-terracotta transition-colors duration-200">
      <p className="font-display text-sm uppercase tracking-wider text-terracotta mb-2">{label}</p>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}
