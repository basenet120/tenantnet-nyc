"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "tn_rs_notice_dismissed";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function RentStabilizedNotice({ buildingType }: { buildingType: string }) {
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

  // Extract stabilization counts from NYC Open Data response
  const unitCounts = stabData?.unitCounts;
  const stabUnits2007 = unitCounts?.uc2007 ? parseInt(unitCounts.uc2007) : null;
  const stabUnitsLatest = unitCounts?.uc2022
    ? parseInt(unitCounts.uc2022)
    : unitCounts?.uc2021
      ? parseInt(unitCounts.uc2021)
      : unitCounts?.uc2020
        ? parseInt(unitCounts.uc2020)
        : null;
  const latestYear = unitCounts?.uc2022
    ? "2022"
    : unitCounts?.uc2021
      ? "2021"
      : unitCounts?.uc2020
        ? "2020"
        : null;

  const unitsLost =
    stabUnits2007 !== null && stabUnitsLatest !== null
      ? stabUnits2007 - stabUnitsLatest
      : null;

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
              Did you know?
            </p>
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-offwhite leading-tight">
              Your building is on record as rent stabilized
            </h2>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-[var(--color-text-secondary)] hover:text-offwhite transition-colors p-1"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="h-[2px] w-12 bg-[var(--color-terracotta)] mb-5" />

        {/* Stabilization unit counts from NYC data */}
        {stabUnitsLatest !== null && (
          <div className="border-2 border-[var(--color-terracotta)]/30 bg-[var(--color-terracotta)]/5 p-4 mb-5">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-display text-3xl text-offwhite">{stabUnitsLatest}</p>
                <p className="text-[0.625rem] uppercase tracking-wider text-[var(--color-text-secondary)]">
                  stabilized units ({latestYear})
                </p>
              </div>
              {stabUnits2007 !== null && stabUnits2007 !== stabUnitsLatest && (
                <div className="text-center">
                  <p className="font-display text-3xl text-[var(--color-text-secondary)]">{stabUnits2007}</p>
                  <p className="text-[0.625rem] uppercase tracking-wider text-[var(--color-text-secondary)]">
                    stabilized units (2007)
                  </p>
                </div>
              )}
              {unitsLost !== null && unitsLost > 0 && (
                <div className="text-center">
                  <p className="font-display text-3xl text-[var(--color-danger)]">-{unitsLost}</p>
                  <p className="text-[0.625rem] uppercase tracking-wider text-[var(--color-danger)]">
                    units lost
                  </p>
                </div>
              )}
            </div>
            {unitsLost !== null && unitsLost > 0 && (
              <p className="text-xs text-amber mt-3">
                This building has lost {unitsLost} rent-stabilized unit{unitsLost !== 1 ? "s" : ""} since 2007.
                Some may have been illegally deregulated.
              </p>
            )}
            <p className="text-[0.625rem] text-[var(--color-text-secondary)] mt-2">
              Source: NYC Rent Stabilization Unit Counts (Open Data)
            </p>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            According to NYC records, this building is <strong className="text-offwhite">rent stabilized</strong>.
            This means your rent increases are regulated by law, and you have important protections
            including lease renewal rights and limits on how much your landlord can raise your rent.
          </p>

          <p>
            Stabilization status is tracked at the <strong className="text-offwhite">building level</strong> in
            NYC databases. To confirm your <strong className="text-offwhite">individual apartment&apos;s</strong> status,
            you need to request your rent history from DHCR (see step 1 below).
          </p>

          <div className="border-2 border-[var(--color-border)] bg-[var(--color-charcoal-light)] p-4">
            <p className="font-display text-xs uppercase tracking-[0.12em] text-amber mb-3">
              How to check if your apartment has been illegally deregulated
            </p>
            <ul className="space-y-2.5 text-[0.8125rem]">
              <li className="flex items-start gap-2">
                <span className="text-terracotta mt-0.5 shrink-0">1.</span>
                <span>
                  <strong className="text-offwhite">Request your apartment&apos;s rent history</strong> from the
                  NYS Division of Housing and Community Renewal (DHCR). This is the only way to verify
                  unit-level stabilization. Call{" "}
                  <strong className="text-offwhite">718-739-6400</strong> or visit{" "}
                  <a
                    href="https://hcr.ny.gov/rent-stabilization-information"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta-light hover:text-terracotta"
                  >
                    hcr.ny.gov
                  </a>.
                  You can also email{" "}
                  <a
                    href="mailto:RentAdmin@hcr.ny.gov"
                    className="text-terracotta-light hover:text-terracotta"
                  >
                    RentAdmin@hcr.ny.gov
                  </a>{" "}
                  with your name, address, and apartment number.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-terracotta mt-0.5 shrink-0">2.</span>
                <span>
                  <strong className="text-offwhite">Look for large rent jumps</strong> in your apartment&apos;s history.
                  If rent suddenly jumped above the deregulation threshold without a documented reason
                  (e.g., major capital improvement), it may have been illegally deregulated.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-terracotta mt-0.5 shrink-0">3.</span>
                <span>
                  <strong className="text-offwhite">Check if preferential rent was used</strong> to inflate
                  the legal registered rent above the threshold while charging you less.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-terracotta mt-0.5 shrink-0">4.</span>
                <span>
                  <strong className="text-offwhite">File a complaint</strong> with DHCR if you suspect
                  illegal deregulation. Under the Housing Stability and Tenant Protection Act (2019),
                  you may be entitled to rent overcharge refunds going back{" "}
                  <strong className="text-offwhite">6 years</strong>.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-xs">
            <strong className="text-offwhite">Free legal help:</strong>{" "}
            <a
              href="https://www.lawhelpny.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta-light hover:text-terracotta"
            >
              LawHelpNY.org
            </a>{" "}
            can connect you with free housing attorneys, or call the{" "}
            <strong className="text-offwhite">Tenant Protection Unit</strong> at{" "}
            <strong className="text-offwhite">718-739-6400</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button onClick={dismiss} className="btn btn-primary flex-1">
            Got It
          </button>
          <a
            href="https://hcr.ny.gov/rent-stabilization-information"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline no-underline"
          >
            Learn More
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
