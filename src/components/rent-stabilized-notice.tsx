"use client";

import { useState, useEffect } from "react";
import { useI18n } from "./i18n-provider";

const STORAGE_KEY = "tn_rs_notice_dismissed";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function RentStabilizedNotice({ buildingType }: { buildingType: string }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [stabData, setStabData] = useState<any>(null);

  useEffect(() => {
    if (buildingType !== "rent_stabilized") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Fetch stabilization unit counts, then show notice
      fetch("/api/building-records?type=rent_stabilization")
        .then((r) => r.json())
        .then((data) => {
          setStabData(data);
          setTimeout(() => setVisible(true), 1200);
        })
        .catch(() => {
          setTimeout(() => setVisible(true), 1200);
        });
    }
  }, [buildingType]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  // Extract HPD registration info from NYC Open Data response
  const reg = stabData?.registration;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-lg border-2 border-[var(--color-terracotta)] bg-[var(--color-charcoal)] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: "fadeSlideUp 0.3s ease" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.15em] text-terracotta mb-1">
              {t("rs_did_you_know")}
            </p>
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-offwhite leading-tight">
              {t("rs_title")}
            </h2>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-[var(--color-text-secondary)] hover:text-offwhite transition-colors p-1"
            aria-label={t("rs_dismiss")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="h-[2px] w-12 bg-[var(--color-terracotta)] mb-5" />

        {/* HPD registration info from NYC data */}
        {reg && (
          <div className="border-2 border-[var(--color-terracotta)]/30 bg-[var(--color-terracotta)]/5 p-4 mb-5">
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
              HPD Registration #{reg.registrationid}
              {reg.lastregistrationdate && ` · Last registered ${new Date(reg.lastregistrationdate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
            </p>
            <p className="text-[0.625rem] text-[var(--color-text-secondary)]">
              {t("rs_source")}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            {t("rs_intro")}
          </p>

          <p>
            {t("rs_unit_level")}
          </p>

          <div className="border-2 border-[var(--color-border)] bg-[var(--color-charcoal-light)] p-4">
            <p className="font-display text-xs uppercase tracking-[0.12em] text-amber mb-3">
              {t("rs_check_title")}
            </p>
            <ul className="space-y-2.5 text-[0.8125rem]">
              <li className="flex items-start gap-2">
                <span className="text-terracotta mt-0.5 shrink-0">1.</span>
                <span>
                  {t("rs_step_1")} {t("rs_step_1_call")}{" "}
                  <strong className="text-offwhite">718-739-6400</strong> {t("rs_step_1_or_visit")}{" "}
                  <a
                    href="https://hcr.ny.gov/rent-stabilization-information"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta-light hover:text-terracotta"
                  >
                    hcr.ny.gov
                  </a>.
                  {" "}{t("rs_step_1_email")}{" "}
                  <a
                    href="mailto:RentAdmin@hcr.ny.gov"
                    className="text-terracotta-light hover:text-terracotta"
                  >
                    RentAdmin@hcr.ny.gov
                  </a>{" "}
                  {t("rs_step_1_email_details")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-terracotta mt-0.5 shrink-0">2.</span>
                <span>
                  {t("rs_step_2")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-terracotta mt-0.5 shrink-0">3.</span>
                <span>
                  {t("rs_step_3")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-terracotta mt-0.5 shrink-0">4.</span>
                <span>
                  {t("rs_step_4_intro")}{" "}
                  <strong className="text-offwhite">{t("rs_step_4_years")}</strong>.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-xs">
            <strong className="text-offwhite">{t("rs_free_legal")}</strong>{" "}
            <a
              href="https://www.lawhelpny.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta-light hover:text-terracotta"
            >
              LawHelpNY.org
            </a>{" "}
            {t("rs_legal_connect")}{" "}
            <strong className="text-offwhite">{t("rs_legal_unit")}</strong> {t("rs_legal_at")}{" "}
            <strong className="text-offwhite">718-739-6400</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button onClick={dismiss} className="btn btn-primary flex-1">
            {t("rs_got_it")}
          </button>
          <a
            href="https://hcr.ny.gov/rent-stabilization-information"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline no-underline"
          >
            {t("rs_learn_more")}
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
