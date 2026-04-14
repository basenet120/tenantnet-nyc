"use client";

import { useState } from "react";

type BuildingRecord = {
  id: string;
  recordType: string;
  url: string;
  label: string;
  description: string;
};

type Tab = {
  key: string;
  label: string;
  apiType: string | null; // null = info-only tab (no API fetch)
};

const TABS: Tab[] = [
  { key: "hpd_violations", label: "HPD Violations", apiType: "hpd_violations" },
  { key: "hpd_complaints", label: "HPD Complaints", apiType: "hpd_complaints" },
  { key: "dob_violations", label: "DOB Violations", apiType: "dob_violations" },
  { key: "dob_complaints", label: "DOB Complaints", apiType: "dob_complaints" },
  { key: "rent_stabilization", label: "Rent Stabilization", apiType: "rent_stabilization" },
  { key: "resources", label: "Resources", apiType: null },
];

// Record types that are informational links (not browsable data)
const INFO_RECORD_TYPES = ["dob_profile", "hpd_registration", "acris", "zola", "nyc_311"];

const RECORD_ICONS: Record<string, string> = {
  dob_profile: "B",
  hpd_registration: "R",
  acris: "A",
  zola: "Z",
  nyc_311: "3",
};

export function BuildingRecordsBrowser({ records }: { records: BuildingRecord[] }) {
  const [activeTab, setActiveTab] = useState("hpd_violations");

  // Filter which tabs are available based on existing records
  const hasHpd = records.some((r) => r.recordType.startsWith("hpd_"));
  const hasDob = records.some((r) => r.recordType.startsWith("dob_"));
  const infoRecords = records.filter((r) => INFO_RECORD_TYPES.includes(r.recordType));

  const availableTabs = TABS.filter((tab) => {
    if (tab.key === "resources") return infoRecords.length > 0;
    if (tab.key.startsWith("hpd_")) return hasHpd;
    if (tab.key.startsWith("dob_")) return hasDob;
    return true;
  });

  // Find matching external link for current tab
  const externalRecord = records.find((r) => r.recordType === activeTab);

  if (records.length === 0) return null;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b-2 border-[var(--color-border)] overflow-x-auto">
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 font-display text-[0.6875rem] tracking-[0.08em] uppercase whitespace-nowrap transition-colors duration-150 ${
              activeTab === tab.key
                ? "text-terracotta border-b-[3px] border-b-terracotta -mb-[2px]"
                : "text-offwhite-dim hover:text-offwhite -mb-[2px] border-b-[3px] border-b-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "resources" ? (
          <ResourceLinks records={infoRecords} />
        ) : activeTab === "rent_stabilization" ? (
          <RentStabilizationTab externalUrl={externalRecord?.url} />
        ) : (
          <ViolationsList type={activeTab} externalUrl={externalRecord?.url} />
        )}
      </div>
    </div>
  );
}

function ResourceLinks({ records }: { records: BuildingRecord[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {records.map((record) => (
        <a
          key={record.id}
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card-dark group no-underline hover:border-l-4 hover:border-l-terracotta transition-all duration-150 flex items-start gap-3"
        >
          <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--color-charcoal-lighter)] text-terracotta font-display text-sm font-bold">
            {RECORD_ICONS[record.recordType] ?? "*"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-offwhite group-hover:text-terracotta transition-colors flex items-center gap-1">
              {record.label}
              <ExternalLinkIcon />
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
              {record.description}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function RentStabilizationTab({ externalUrl }: { externalUrl?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/building-records?type=rent_stabilization");
      if (res.ok) {
        setData(await res.json());
      }
      setLoaded(true);
    } catch {
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  if (!loaded && !loading) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          View rent stabilization unit counts from NYC public records.
        </p>
        <button onClick={loadData} className="btn btn-outline">
          Load Stabilization Data
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-text-secondary)] animate-pulse">
          Loading stabilization data...
        </p>
      </div>
    );
  }

  const uc = data?.unitCounts;

  return (
    <div className="space-y-4">
      {uc ? (
        <>
          {/* Unit count timeline */}
          <div className="card-dark">
            <h3 className="font-display text-xs uppercase tracking-[0.12em] text-terracotta mb-4">
              Stabilized Unit Counts Over Time
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {["2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"].map((year) => {
                const key = `uc${year}`;
                const val = uc[key];
                if (!val && val !== 0) return null;
                const count = parseInt(val);
                return (
                  <div key={year} className="text-center p-2 border border-[var(--color-border)]">
                    <p className="font-display text-xl text-offwhite">{count}</p>
                    <p className="text-[0.5625rem] uppercase tracking-wider text-[var(--color-text-secondary)]">{year}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Building info from dataset */}
          {(uc.ownername || uc.unitstotal) && (
            <div className="card-dark">
              <h3 className="font-display text-xs uppercase tracking-[0.12em] text-terracotta mb-3">
                Registration Details
              </h3>
              <dl className="space-y-2 text-sm">
                {uc.ownername && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">Owner</dt>
                    <dd className="text-offwhite">{uc.ownername}</dd>
                  </div>
                )}
                {uc.unitstotal && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">Total Units</dt>
                    <dd className="text-offwhite">{uc.unitstotal}</dd>
                  </div>
                )}
                {uc.bldgzip && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">ZIP</dt>
                    <dd className="text-offwhite">{uc.bldgzip}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {data?.message || "No stabilization count data found for this building."}
          </p>
        </div>
      )}

      {/* How to check individual apartment */}
      <div className="card-dark border-l-[3px] border-l-amber">
        <h3 className="font-display text-xs uppercase tracking-[0.12em] text-amber mb-2">
          Checking your individual apartment
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          NYC tracks stabilization at the building level. To verify your specific apartment&apos;s
          status, request your rent history from DHCR at{" "}
          <strong className="text-offwhite">718-739-6400</strong> or{" "}
          <a
            href="mailto:RentAdmin@hcr.ny.gov"
            className="text-terracotta-light hover:text-terracotta"
          >
            RentAdmin@hcr.ny.gov
          </a>.
        </p>
      </div>

      {externalUrl && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-terracotta-light hover:text-terracotta"
        >
          View full HPD registration on NYC website <ExternalLinkIcon />
        </a>
      )}
    </div>
  );
}

function ViolationsList({ type, externalUrl }: { type: string; externalUrl?: string }) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/building-records?type=${type}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to load data");
        return;
      }
      const json = await res.json();
      setData(json);
      setLoaded(true);
    } catch {
      setError("Failed to connect to NYC Open Data");
    } finally {
      setLoading(false);
    }
  }

  if (!loaded && !loading) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          {getTypeDescription(type)}
        </p>
        <button onClick={loadData} className="btn btn-outline">
          Load Records from NYC Open Data
        </button>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-xs text-terracotta-light hover:text-terracotta"
          >
            Or view on NYC website <ExternalLinkIcon />
          </a>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-text-secondary)] animate-pulse">
          Loading from NYC Open Data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-danger)] mb-3">{error}</p>
        <button onClick={loadData} className="btn btn-outline btn-sm">
          Retry
        </button>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-xs text-terracotta-light hover:text-terracotta"
          >
            View on NYC website instead <ExternalLinkIcon />
          </a>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-sage)]">
          No records found — that&apos;s a good sign.
        </p>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-xs text-terracotta-light hover:text-terracotta"
          >
            Verify on NYC website <ExternalLinkIcon />
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--color-text-secondary)]">
          {data.length} record{data.length !== 1 ? "s" : ""} found
          {data.length === 50 && " (showing most recent 50)"}
        </p>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-terracotta-light hover:text-terracotta flex items-center gap-1"
          >
            NYC website <ExternalLinkIcon />
          </a>
        )}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {data.map((item: any, i: number) => (
          <RecordRow key={i} type={type} item={item} />
        ))}
      </div>
    </div>
  );
}

function RecordRow({ type, item }: { type: string; item: any }) {
  if (type === "hpd_violations") {
    return (
      <div className="card-dark py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-offwhite">
              {item.novdescription || item.violationstatus || "Violation"}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {item.apartment && `Apt ${item.apartment} · `}
              {item.inspectiondate &&
                new Date(item.inspectiondate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
            </p>
          </div>
          <StatusPill
            status={item.violationstatus}
            colorMap={{
              "Open": "terracotta",
              "Close": "sage",
              "Closed": "sage",
            }}
          />
        </div>
        {item.novissueddate && (
          <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-2">
            <span className="text-offwhite-dim">Class {item.class || "—"}</span>
            {" · NOV issued "}
            {new Date(item.novissueddate).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }

  if (type === "hpd_complaints") {
    return (
      <div className="card-dark py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-offwhite">
              {item.complaint_type || item.majorcategory || "Complaint"}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {item.apartment && `Apt ${item.apartment} · `}
              {item.receiveddate &&
                new Date(item.receiveddate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
            </p>
          </div>
          <StatusPill
            status={item.status}
            colorMap={{
              "Open": "terracotta",
              "Close": "sage",
              "Closed": "sage",
            }}
          />
        </div>
        {(item.majorcategory || item.minorcategory) && (
          <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-2">
            {item.majorcategory}
            {item.minorcategory && ` — ${item.minorcategory}`}
          </p>
        )}
      </div>
    );
  }

  if (type === "dob_violations") {
    return (
      <div className="card-dark py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-offwhite">
              {item.violation_type || item.infraction_codes || "DOB Violation"}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {item.violation_date &&
                new Date(item.violation_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              {item.penalty_balance_due &&
                ` · $${parseFloat(item.penalty_balance_due).toLocaleString()} due`}
            </p>
          </div>
          <StatusPill
            status={item.violation_status || item.hearing_status}
            colorMap={{
              "RESOLVE": "sage",
              "RESOLVED": "sage",
              "DEFAULT": "terracotta",
              "PENALIZE": "amber",
            }}
          />
        </div>
        {item.respondent_name && (
          <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-2">
            Respondent: {item.respondent_name}
          </p>
        )}
      </div>
    );
  }

  if (type === "dob_complaints") {
    return (
      <div className="card-dark py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-offwhite">
              {item.complaint_category || "DOB Complaint"}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {item.date_entered &&
                new Date(item.date_entered).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              {item.unit && ` · Unit ${item.unit}`}
            </p>
          </div>
          <StatusPill
            status={item.status}
            colorMap={{
              "ACTIVE": "terracotta",
              "CLOSED": "sage",
              "CLOSE": "sage",
            }}
          />
        </div>
        {item.dobrundate && (
          <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-2">
            Inspection: {new Date(item.dobrundate).toLocaleDateString()}
            {item.disposition_code && ` · Disposition: ${item.disposition_code}`}
          </p>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="card-dark py-3 px-4">
      <p className="text-sm text-offwhite">{JSON.stringify(item).slice(0, 200)}</p>
    </div>
  );
}

function StatusPill({
  status,
  colorMap,
}: {
  status?: string;
  colorMap: Record<string, string>;
}) {
  if (!status) return null;
  const upper = status.toUpperCase();
  const color = Object.entries(colorMap).find(([k]) => upper.includes(k))?.[1] ?? "muted";
  const badgeClass = `badge badge-${color}`;
  return <span className={badgeClass}>{status}</span>;
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="inline h-3 w-3 text-[var(--color-text-secondary)]"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}

function getTypeDescription(type: string): string {
  switch (type) {
    case "hpd_violations":
      return "Housing code violations from the NYC Department of Housing Preservation & Development.";
    case "hpd_complaints":
      return "Housing complaints filed with HPD for issues like heat, hot water, pests, and more.";
    case "dob_violations":
      return "Building code violations from the NYC Department of Buildings.";
    case "dob_complaints":
      return "Complaints filed with the Department of Buildings about construction, safety, and permits.";
    default:
      return "NYC public records for this building.";
  }
}
