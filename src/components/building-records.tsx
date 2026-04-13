type BuildingRecord = {
  id: string;
  recordType: string;
  url: string;
  label: string;
  description: string;
};

const RECORD_ICONS: Record<string, string> = {
  dob_profile: "B",
  dob_violations: "!",
  dob_complaints: "C",
  hpd_violations: "H",
  hpd_complaints: "H",
  hpd_registration: "R",
  nyc_311: "3",
  acris: "A",
  zola: "Z",
  custom: "*",
};

export function BuildingRecords({ records }: { records: BuildingRecord[] }) {
  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[var(--color-text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
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
