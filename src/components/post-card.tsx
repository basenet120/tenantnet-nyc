import Link from "next/link";
import { StatusBadge } from "./status-badge";

type PostCardProps = {
  id: string;
  title: string;
  body: string;
  authorLabel: string;
  sectionName: string;
  status: string | null;
  isPinned: boolean;
  createdAt: Date;
  commentCount: number;
  imageCount: number;
  isAdmin?: boolean;
};

export function PostCard({
  id,
  title,
  body,
  authorLabel,
  sectionName,
  status,
  isPinned,
  createdAt,
  commentCount,
  imageCount,
  isAdmin = false,
}: PostCardProps) {
  return (
    <Link href={`/post/${id}`} className="block group no-underline">
      <div
        className={`relative bg-surface text-charcoal border-2 border-border rounded-none p-5 transition-all duration-150 hover:border-l-terracotta hover:border-l-4 ${
          isPinned ? "border-l-4 border-l-amber" : ""
        }`}
      >
        {/* Top row: section label + status badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="font-display text-[0.6875rem] tracking-[0.12em] uppercase text-charcoal-lighter">
            {sectionName}
          </span>
          {status && <StatusBadge status={status} />}
        </div>

        {/* Title */}
        <h3 className="font-display text-lg uppercase leading-tight text-charcoal mb-1 truncate group-hover:text-terracotta transition-colors">
          {title}
        </h3>

        {/* Body excerpt */}
        <p className="text-sm text-charcoal-lighter leading-relaxed line-clamp-2 mb-3">
          {body}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[0.6875rem] tracking-wide text-charcoal-lighter font-mono">
          {isAdmin && (
            <>
              <span className="inline-flex items-center gap-1 text-terracotta font-bold uppercase">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-terracotta" />
                MOD
              </span>
              <span aria-hidden="true" className="text-border-light">|</span>
            </>
          )}
          <span>{authorLabel}</span>
          <span aria-hidden="true" className="text-border-light">|</span>
          <span>{createdAt.toLocaleDateString()}</span>
          {commentCount > 0 && (
            <>
              <span aria-hidden="true" className="text-border-light">|</span>
              <span>{commentCount} comments</span>
            </>
          )}
          {imageCount > 0 && (
            <>
              <span aria-hidden="true" className="text-border-light">|</span>
              <span>{imageCount} photos</span>
            </>
          )}
          {isPinned && (
            <>
              <span aria-hidden="true" className="text-border-light">|</span>
              <span className="text-amber-dark font-bold uppercase">Pinned</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
