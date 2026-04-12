import Link from "next/link";

type SectionNavProps = { sections: { name: string; slug: string }[] };

const SECTION_ICONS: Record<string, string> = {
  maintenance: "\uD83D\uDD27",
  "landlord-issues": "\u26A0\uFE0F",
  bulletins: "\uD83D\uDCCB",
  community: "\uD83C\uDFD8\uFE0F",
  safety: "\uD83D\uDD12",
};

export function SectionNav({ sections }: SectionNavProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {sections.map((section) => (
        <Link
          key={section.slug}
          href={`/section/${section.slug}`}
          className="flex flex-col items-center gap-2 border-2 border-border rounded-none px-4 py-4 text-center no-underline transition-all duration-150 hover:bg-terracotta hover:border-terracotta hover:text-offwhite group"
        >
          <span className="text-2xl" aria-hidden="true">
            {SECTION_ICONS[section.slug] || "\uD83D\uDCCC"}
          </span>
          <span className="font-display text-[0.75rem] tracking-[0.08em] uppercase text-offwhite group-hover:text-offwhite">
            {section.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
