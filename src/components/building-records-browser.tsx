"use client";

import { useState } from "react";
import { useI18n } from "./i18n-provider";
import type { AppStrings } from "@/lib/get-app-strings";

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

export function BuildingRecordsBrowser({ records, buildingId }: { records: BuildingRecord[]; buildingId?: string }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("hpd_violations");

  const tabLabel = (key: string) => {
    switch (key) {
      case "hpd_violations": return t("records_hpd_violations");
      case "hpd_complaints": return t("records_hpd_complaints");
      case "dob_violations": return t("records_dob_violations");
      case "dob_complaints": return t("records_dob_complaints");
      case "rent_stabilization": return t("records_rent_stabilization");
      case "resources": return t("records_resources");
      default: return key;
    }
  };

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
      <div className="flex flex-wrap gap-0 border-b-2 border-[var(--color-border)]">
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 font-display text-[0.6875rem] tracking-[0.08em] uppercase transition-colors duration-150 ${
              activeTab === tab.key
                ? "text-terracotta border-b-[3px] border-b-terracotta -mb-[2px]"
                : "text-offwhite-dim hover:text-offwhite -mb-[2px] border-b-[3px] border-b-transparent"
            }`}
          >
            {tabLabel(tab.key)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "resources" ? (
          <ResourceLinks records={infoRecords} />
        ) : activeTab === "rent_stabilization" ? (
          <RentStabilizationTab externalUrl={externalRecord?.url} buildingId={buildingId} />
        ) : (
          <ViolationsList key={activeTab} type={activeTab} externalUrl={externalRecord?.url} buildingId={buildingId} />
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
function RentStabilizationTab({ externalUrl, buildingId }: { externalUrl?: string; buildingId?: string }) {
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "rent_stabilization" });
      if (buildingId) params.set("buildingId", buildingId);
      const res = await fetch(`/api/building-records?${params}`);
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
          {t("records_stab_desc")}
        </p>
        <button onClick={loadData} className="btn btn-outline">
          {t("records_load_stab")}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-text-secondary)] animate-pulse">
          {t("records_loading_stab")}
        </p>
      </div>
    );
  }

  const reg = data?.registration;

  return (
    <div className="space-y-4">
      {reg ? (
        <div className="card-dark">
          <h3 className="font-display text-xs uppercase tracking-[0.12em] text-terracotta mb-4">
            {t("records_stab_title")}
          </h3>
          <dl className="space-y-2 text-sm">
            {reg.housenumber && reg.streetname && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("records_stab_address")}</dt>
                <dd className="text-offwhite">{reg.housenumber} {reg.streetname}</dd>
              </div>
            )}
            {reg.boro && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("records_stab_borough")}</dt>
                <dd className="text-offwhite capitalize">{reg.boro.toLowerCase()}</dd>
              </div>
            )}
            {reg.zip && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("records_stab_zip")}</dt>
                <dd className="text-offwhite">{reg.zip}</dd>
              </div>
            )}
            {reg.registrationid && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("records_stab_reg_id")}</dt>
                <dd className="text-offwhite">{reg.registrationid}</dd>
              </div>
            )}
            {reg.lastregistrationdate && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("records_stab_last_reg")}</dt>
                <dd className="text-offwhite">
                  {new Date(reg.lastregistrationdate).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </dd>
              </div>
            )}
            {reg.registrationenddate && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("records_stab_expires")}</dt>
                <dd className="text-offwhite">
                  {new Date(reg.registrationenddate).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">{t("records_stab_type")}</dt>
              <dd className="text-offwhite capitalize">{data?.buildingType?.replace("_", " ") ?? "—"}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {data?.message || t("records_stab_none")}
          </p>
        </div>
      )}

      {/* How to check individual apartment */}
      <div className="card-dark border-l-[3px] border-l-amber">
        <h3 className="font-display text-xs uppercase tracking-[0.12em] text-amber mb-2">
          {t("records_stab_check_title")}
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {t("records_stab_check_desc")}{" "}
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
          {t("records_stab_view_hpd")} <ExternalLinkIcon />
        </a>
      )}
    </div>
  );
}

function ViolationsList({ type, externalUrl, buildingId }: { type: string; externalUrl?: string; buildingId?: string }) {
  const { t } = useI18n();
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ type });
      if (buildingId) params.set("buildingId", buildingId);
      const res = await fetch(`/api/building-records?${params}`);
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
          {getTypeDescription(type, t)}
        </p>
        <button onClick={loadData} className="btn btn-outline">
          {t("records_load")}
        </button>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-xs text-terracotta-light hover:text-terracotta"
          >
            {t("records_or_view")} <ExternalLinkIcon />
          </a>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-text-secondary)] animate-pulse">
          {t("records_loading")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-danger)] mb-3">{error}</p>
        <button onClick={loadData} className="btn btn-outline btn-sm">
          {t("records_retry")}
        </button>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-xs text-terracotta-light hover:text-terracotta"
          >
            {t("records_view_instead")} <ExternalLinkIcon />
          </a>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-[var(--color-sage)]">
          {t("records_none")}
        </p>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-xs text-terracotta-light hover:text-terracotta"
          >
            {t("records_verify")} <ExternalLinkIcon />
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--color-text-secondary)]">
          {data.length} {t("records_found")}
          {data.length === 50 && ` ${t("records_showing_50")}`}
        </p>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-terracotta-light hover:text-terracotta flex items-center gap-1"
          >
            {t("records_view_nyc")} <ExternalLinkIcon />
          </a>
        )}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {data.map((item: any, i: number) => (
          <RecordRow key={i} type={type} item={item} externalUrl={externalUrl} />
        ))}
      </div>
    </div>
  );
}

function getRecordUrl(type: string, item: any, externalUrl?: string): string | null {
  // HPD uses internal buildingid for URLs
  if (type === "hpd_violations" && (item.buildingid || item.building_id)) {
    const bid = item.buildingid || item.building_id;
    return `https://hpdonline.nyc.gov/hpdonline/building/${bid}/violations`;
  }
  if (type === "hpd_complaints" && (item.buildingid || item.building_id)) {
    const bid = item.buildingid || item.building_id;
    return `https://hpdonline.nyc.gov/hpdonline/building/${bid}/complaints`;
  }
  // DOB NOW hash URLs don't work as direct links — fall back to the stored external URL
  if (type === "dob_violations" || type === "dob_complaints") {
    return externalUrl || null;
  }
  return null;
}

function RecordRow({ type, item, externalUrl }: { type: string; item: any; externalUrl?: string }) {
  const { t } = useI18n();
  const url = getRecordUrl(type, item, externalUrl);
  const content = <RecordRowContent type={type} item={item} />;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block card-dark py-3 px-4 no-underline hover:border-l-4 hover:border-l-terracotta transition-all group cursor-pointer"
      >
        {content}
        <p className="text-[0.5625rem] text-[var(--color-text-secondary)] mt-2 flex items-center gap-1 group-hover:text-terracotta-light transition-colors">
          {t("records_view_city")} <ExternalLinkIcon />
        </p>
      </a>
    );
  }

  return <div className="card-dark py-3 px-4">{content}</div>;
}

function RecordRowContent({ type, item }: { type: string; item: any }) {
  if (type === "hpd_violations") {
    return (
      <>
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
      </>
    );
  }

  if (type === "hpd_complaints") {
    return (
      <>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-offwhite">
              {item.major_category || item.type || "Complaint"}
              {item.minor_category && ` — ${item.minor_category}`}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {item.apartment && `Apt ${item.apartment} · `}
              {item.space_type && `${item.space_type} · `}
              {item.received_date &&
                new Date(item.received_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
            </p>
          </div>
          <StatusPill
            status={item.complaint_status || item.problem_status}
            colorMap={{
              "OPEN": "terracotta",
              "CLOSE": "sage",
              "CLOSED": "sage",
            }}
          />
        </div>
        {item.status_description && (
          <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-2 line-clamp-2">
            {item.status_description}
          </p>
        )}
      </>
    );
  }

  if (type === "dob_violations") {
    const issueDate = item.issue_date ? parseYYYYMMDD(item.issue_date) : null;
    return (
      <>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-offwhite">
              {item.description || item.violation_type || "DOB Violation"}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {issueDate && `Issued ${issueDate}`}
              {item.violation_number && ` · #${item.violation_number}`}
            </p>
          </div>
          <StatusPill
            status={item.violation_category?.includes("DISMISSED") ? "DISMISSED"
              : item.violation_category?.includes("ACTIVE") ? "ACTIVE"
              : item.disposition_date ? "RESOLVED" : undefined}
            colorMap={{
              "RESOLVED": "sage",
              "DISMISSED": "sage",
              "ACTIVE": "terracotta",
            }}
          />
        </div>
        {item.disposition_comments && (
          <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-2 line-clamp-2">
            {item.disposition_comments}
          </p>
        )}
      </>
    );
  }

  if (type === "dob_complaints") {
    return (
      <>
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
      </>
    );
  }

  // Fallback
  return <p className="text-sm text-offwhite">{JSON.stringify(item).slice(0, 200)}</p>;
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

function parseYYYYMMDD(s: string): string | null {
  if (!s || s.length < 8) return null;
  const y = s.slice(0, 4);
  const m = parseInt(s.slice(4, 6));
  const d = parseInt(s.slice(6, 8));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function getTypeDescription(type: string, t: (key: keyof AppStrings) => string): string {
  switch (type) {
    case "hpd_violations":
      return t("records_desc_hpd_violations");
    case "hpd_complaints":
      return t("records_desc_hpd_complaints");
    case "dob_violations":
      return t("records_desc_dob_violations");
    case "dob_complaints":
      return t("records_desc_dob_complaints");
    default:
      return t("records_desc_default");
  }
}
