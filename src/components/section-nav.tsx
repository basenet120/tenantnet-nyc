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
    <div className="flex flex-wrap gap-2">
      {sections.map((section) => (
        <Link key={section.slug} href={`/section/${section.slug}`}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm hover:border-gray-300 transition-colors">
          <span>{SECTION_ICONS[section.slug] || "\uD83D\uDCCC"}</span>
          <span>{section.name}</span>
        </Link>
      ))}
    </div>
  );
}
