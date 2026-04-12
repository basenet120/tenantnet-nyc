const STATUS_STYLES: Record<string, string> = {
  reported:
    "bg-amber text-charcoal",
  acknowledged:
    "bg-terracotta text-offwhite",
  fixed:
    "bg-sage text-offwhite",
  unresolved:
    "bg-danger text-offwhite",
};

const FALLBACK = "bg-charcoal-lighter text-offwhite-dim";

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || FALLBACK;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide rounded-[2px] leading-tight ${style}`}
    >
      {status}
    </span>
  );
}
