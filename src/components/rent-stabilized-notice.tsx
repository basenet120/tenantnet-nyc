"use client";

import { useState, useEffect } from "react";
import { useI18n } from "./i18n-provider";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
    <Dialog open={visible} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="w-full max-w-lg border-2 border-[var(--color-terracotta)] bg-[var(--color-charcoal)] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <p className="font-display text-xs uppercase tracking-[0.15em] text-terracotta mb-1">
            {t("rs_did_you_know")}
          </p>
          <DialogTitle className="font-display text-xl sm:text-2xl uppercase tracking-tight text-offwhite leading-tight">
            {t("rs_title")}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("rs_intro")}</DialogDescription>
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
      </DialogContent>
    </Dialog>
  );
}
