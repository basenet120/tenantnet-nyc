import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BuildingSignupForm } from "@/components/building-signup-form";
import { LanguagePicker } from "@/components/language-picker";
import { LandingSkyline } from "@/components/landing-skyline-wrapper";
import { HeroStarfield } from "@/components/hero-starfield";
import { getLang } from "@/lib/get-lang";
import { translateUiStrings, RTL_LANGS } from "@/lib/i18n";
import landingStrings from "@/i18n/landing.en.json";

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

  const lang = await getLang();
  const strings = await translateUiStrings(landingStrings, lang, "landing");
  const t = (key: keyof typeof landingStrings) => strings[key] ?? landingStrings[key];
  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";

  return (
    <div className="min-h-dvh" dir={dir}>
      {/* Fixed language picker — top left */}
      <div className="fixed top-4 left-4 z-50">
        <LanguagePicker currentLang={lang} />
      </div>

      {/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden isolate">
        {/* Starfield — deepest layer. Static + twinkling dots in the upper
            sky, with an occasional shooting star streaking diagonally. */}
        <div className="absolute inset-0 z-0">
          <HeroStarfield />
        </div>

        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] z-10"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-border-light) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-border-light) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* 3D brutalist skyline — covers the full hero so clouds and
            aircraft can render in the upper sky above the text, while
            buildings hug the bottom. */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <LandingSkyline />
        </div>

        {/* Uniform low-opacity gray veil over the entire background scene
            (stars + grid + skyline). Replaces the previous per-canvas
            opacity trick — buildings stay fully opaque, but the whole
            backdrop reads as slightly muted so hero text pops. */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{ background: "rgba(30, 30, 30, 0.5)" }}
        />

        {/* Text-shape darkness — a layered text-shadow on each hero element
            creates a dark halo that hugs the actual letter silhouettes,
            instead of a circular overlay. No inset div; the shadow is
            applied via `hero-text-shadow` on the content container. */}
        <div className="container-wide relative z-40 hero-text-shadow">
          <div className="max-w-5xl py-12 sm:py-32">
            {/* Overline — mobile base is 70% of desktop (0.6875 * 0.7 ≈ 0.481rem) */}
            <p className="font-display text-[0.481rem] sm:text-[0.6875rem] tracking-[0.25em] uppercase text-[var(--color-text-secondary)] mb-1.5 sm:mb-3 animate-in">
              {t("hero_overline")}
            </p>

            {/* Main title — mobile clamp max is 70% of desktop (9rem -> 6.3rem, 10vw -> 7vw, 3.5rem -> 2.45rem) */}
            <h1 className="font-display text-[clamp(2.45rem,7vw,6.3rem)] sm:text-[clamp(3.5rem,10vw,9rem)] uppercase leading-[0.85] tracking-tight text-offwhite mb-0 animate-in stagger-1">
              TENANT
              <br />
              NET<span className="text-terracotta">.NYC</span>
            </h1>

            {/* Subtitle bar — mobile 70% of the previous text-lg (1.125rem -> 0.7875rem) */}
            <div className="mt-2 sm:mt-4 border-l-[3px] border-terracotta pl-5 max-w-xl animate-in stagger-2">
              <p className="text-[1.18rem] sm:text-xl text-offwhite leading-snug font-medium">
                {t("hero_subtitle")}
              </p>
            </div>

            {/* CTA row */}
            <div className="mt-3 sm:mt-5 flex flex-wrap gap-3 sm:gap-4 animate-in stagger-3">
              <Link href="/login" className="btn btn-primary no-underline text-[0.7em] sm:text-base">
                {t("hero_btn_login")}
              </Link>
              <a
                href="#how-it-works"
                className="btn btn-outline no-underline text-[0.7em] sm:text-base"
                style={{ background: "var(--color-charcoal-light)" }}
              >
                {t("hero_btn_learn")}
              </a>
            </div>

            {/* Quick stat strip — mobile stat numbers 70% of text-3xl (1.875rem -> 1.3125rem) */}
            <div className="mt-4 sm:mt-8 flex flex-wrap gap-6 sm:gap-10 animate-in stagger-4">
              <div>
                <p className="font-display text-[1.3125rem] sm:text-4xl text-terracotta">100%</p>
                <p className="text-[0.481rem] sm:text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mt-1">{t("hero_stat_free")}</p>
              </div>
              <div>
                <p className="font-display text-[1.3125rem] sm:text-4xl text-offwhite">QR</p>
                <p className="text-[0.481rem] sm:text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mt-1">{t("hero_stat_qr")}</p>
              </div>
              <div>
                <p className="font-display text-[1.3125rem] sm:text-4xl text-offwhite">NYC</p>
                <p className="text-[0.481rem] sm:text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mt-1">{t("hero_stat_nyc")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-in stagger-5">
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
            <span className="text-[0.5625rem] uppercase tracking-[0.2em]">{t("hero_scroll")}</span>
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
            <div>
              <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
                {t("what_overline")}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite">
                {t("what_title_1")}
                <br />
                <span className="text-terracotta">{t("what_title_2")}</span>
              </h2>
              <p className="mt-6 text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
                {t("what_desc")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[2px] bg-[var(--color-border)]">
              <FeatureCard number="01" title={t("feat_01_title")} description={t("feat_01_desc")} />
              <FeatureCard number="02" title={t("feat_02_title")} description={t("feat_02_desc")} />
              <FeatureCard number="03" title={t("feat_03_title")} description={t("feat_03_desc")} />
              <FeatureCard number="04" title={t("feat_04_title")} description={t("feat_04_desc")} />
              <FeatureCard number="05" title={t("feat_05_title")} description={t("feat_05_desc")} />
              <FeatureCard number="06" title={t("feat_06_title")} description={t("feat_06_desc")} />
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
            {t("how_overline")}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite mb-16">
            {t("how_title_1")} <span className="text-terracotta">{t("how_title_2")}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <StepCard step="01" title={t("how_step1_title")} description={t("how_step1_desc")} isFirst />
            <StepCard step="02" title={t("how_step2_title")} description={t("how_step2_desc")} />
            <StepCard step="03" title={t("how_step3_title")} description={t("how_step3_desc")} isLast />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHO IT'S FOR
          ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t-2 border-[var(--color-border)]">
        <div className="container-wide">
          <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
            {t("who_overline")}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite mb-12">
            {t("who_title_1")} <span className="text-terracotta">{t("who_title_2")}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AudienceCard label={t("who_rent_label")} description={t("who_rent_desc")} />
            <AudienceCard label={t("who_market_label")} description={t("who_market_desc")} />
            <AudienceCard label={t("who_nycha_label")} description={t("who_nycha_desc")} />
            <AudienceCard label={t("who_coop_label")} description={t("who_coop_desc")} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          NYC RECORDS CALLOUT
          ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t-2 border-[var(--color-border)] relative overflow-hidden">
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
                {t("records_overline")}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite mb-6">
                {t("records_title_1")}
                <br />
                <span className="text-terracotta">{t("records_title_2")}</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-md">
                {t("records_desc")}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[2px] bg-[var(--color-border)]">
              {[
                { code: "DOB", label: t("records_dob_label"), sub: t("records_dob_sub") },
                { code: "HPD", label: t("records_hpd_v_label"), sub: t("records_hpd_v_sub") },
                { code: "HPD", label: t("records_hpd_c_label"), sub: t("records_hpd_c_sub") },
                { code: "311", label: t("records_311_label"), sub: t("records_311_sub") },
                { code: "ACRIS", label: t("records_acris_label"), sub: t("records_acris_sub") },
                { code: "ZoLA", label: t("records_zola_label"), sub: t("records_zola_sub") },
              ].map((record, i) => (
                <div key={i} className="bg-[var(--color-charcoal-light)] p-4">
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
            {t("roles_overline")}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-offwhite mb-12">
            {t("roles_title_1")} <span className="text-terracotta">{t("roles_title_2")}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-[var(--color-border)] p-6 relative">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-terracotta" />
              <p className="font-display text-lg uppercase text-offwhite mt-2">{t("roles_rep_title")}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">{t("roles_rep_desc")}</p>
            </div>
            <div className="border-2 border-[var(--color-border)] p-6 relative">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-amber" />
              <p className="font-display text-lg uppercase text-offwhite mt-2">{t("roles_tenant_title")}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">{t("roles_tenant_desc")}</p>
            </div>
            <div className="border-2 border-[var(--color-border)] p-6 relative">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-sage" />
              <p className="font-display text-lg uppercase text-offwhite mt-2">{t("roles_mgmt_title")}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">{t("roles_mgmt_desc")}</p>
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
            {t("cta_overline")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl uppercase leading-[0.95] text-offwhite mb-3">
            {t("cta_title_1")} <span className="text-terracotta">{t("cta_title_2")}</span>
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
            {t("cta_desc")}
          </p>
          <Link href="/login" className="btn btn-primary no-underline">
            {t("hero_btn_login")}
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BUILDING SIGNUP
          ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t-2 border-terracotta relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-terracotta" />

        <div className="container-narrow">
          <div className="text-center mb-12">
            <p className="font-display text-[0.6875rem] tracking-[0.2em] uppercase text-terracotta mb-4">
              {t("signup_overline")}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase leading-[0.9] text-offwhite mb-4">
              {t("signup_title_1")}
              <br />
              <span className="text-terracotta">{t("signup_title_2")}</span>
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-lg mx-auto">
              {t("signup_desc")}
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <BuildingSignupForm />
          </div>

          <p className="text-center text-sm text-[var(--color-text-secondary)] mt-10">
            {t("signup_contact")}{" "}
            <a href="mailto:hello@tenantnet.nyc" className="text-terracotta-light hover:text-terracotta">
              hello@tenantnet.nyc
            </a>
          </p>
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
                {t("footer_tagline")}
              </span>
            </div>
            <div className="flex items-center gap-6 text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
              <a href="mailto:hello@tenantnet.nyc" className="hover:text-offwhite transition-colors no-underline">{t("footer_contact")}</a>
              <Link href="/login" className="hover:text-offwhite transition-colors no-underline">{t("footer_login")}</Link>
              <a href="#how-it-works" className="hover:text-offwhite transition-colors no-underline">{t("footer_how")}</a>
              <Link href="/admin/login" className="hover:text-offwhite transition-colors no-underline">{t("footer_admin")}</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll pulse animation + hero text shadow (darkness hugs letter shapes) */}
      <style>{`
        @keyframes scrollPulse {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        .hero-text-shadow,
        .hero-text-shadow * {
          text-shadow:
            0 0 8px rgba(0, 0, 0, 0.9),
            0 0 18px rgba(0, 0, 0, 0.75),
            0 0 36px rgba(0, 0, 0, 0.55);
        }
        /* Buttons render their own chrome — strip the shadow off them so
           the text inside CTAs doesn't pick up a glow that clashes with
           the button border/background. */
        .hero-text-shadow .btn,
        .hero-text-shadow .btn * {
          text-shadow: none;
        }
      `}</style>
    </div>
  );
}

/* ─── Sub-components ─── */

function FeatureCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-[var(--color-charcoal-light)] p-6 group">
      <span className="font-display text-2xl text-[var(--color-border-light)] group-hover:text-terracotta transition-colors duration-300">
        {number}
      </span>
      <h3 className="font-display text-base uppercase tracking-wide text-offwhite mt-2 mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description, isFirst, isLast }: { step: string; title: string; description: string; isFirst?: boolean; isLast?: boolean }) {
  return (
    <div className={`relative p-8 border-2 border-[var(--color-border)] ${!isLast ? "md:border-r-0" : ""}`}>
      {!isFirst && (
        <div className="hidden md:block absolute -left-[2px] top-1/2 -translate-y-1/2 w-[2px] h-8 bg-terracotta" />
      )}
      <span className="font-display text-5xl text-[var(--color-charcoal-lighter)]">{step}</span>
      <h3 className="font-display text-lg uppercase tracking-wide text-offwhite mt-3 mb-3">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
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
