"use client";

import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { TranslatedText } from "./translated-text";
import { useI18n } from "./i18n-provider";

type PostCardProps = {
  id: string;
  title: string;
  body: string;
  authorLabel: string;
  sectionName: string;
  status: string | null;
  isPinned: boolean;
  visibility?: string;
  createdAt: Date | string;
  commentCount: number;
  imageCount: number;
  isAdmin?: boolean;
  lang?: string;
  titleEn?: string | null;
  bodyEn?: string | null;
};

export function PostCard({
  id,
  title,
  body,
  authorLabel,
  sectionName,
  status,
  isPinned,
  visibility,
  createdAt,
  commentCount,
  imageCount,
  isAdmin = false,
  lang = "en",
  titleEn,
  bodyEn,
}: PostCardProps) {
  const { t } = useI18n();
  const shouldTranslate = lang !== "en";
  const translationTitle = titleEn || title;
  const translationBody = bodyEn || body;

  return (
    <Link href={`/post/${id}`} className="block group no-underline">
      <div
        className={`card relative p-5 transition-all duration-150 hover:border-l-terracotta hover:border-l-4 ${
          isPinned ? "border-l-4 border-l-amber" : ""
        }`}
      >
        {/* Top row: section label + status badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="font-display text-[0.6875rem] tracking-[0.12em] uppercase" style={{ color: "var(--color-charcoal-lighter)" }}>
            {sectionName}
          </span>
          <div className="flex items-center gap-2">
            {visibility === "private" && (
              <span className="inline-flex items-center gap-1 text-[0.625rem] font-display uppercase tracking-wider" style={{ color: "var(--color-charcoal-lighter)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                {t("post_private")}
              </span>
            )}
            {status && <StatusBadge status={status} />}
          </div>
        </div>

        {/* Title */}
        {shouldTranslate ? (
          <TranslatedText
            as="h3"
            className="font-display text-lg uppercase leading-tight mb-1 truncate group-hover:text-terracotta transition-colors"
            text={translationTitle}
            lang={lang}
            sourceType="post_title"
            sourceId={id}
          />
        ) : (
          <h3
            className="font-display text-lg uppercase leading-tight mb-1 truncate group-hover:text-terracotta transition-colors"
            style={{ color: "var(--color-charcoal)" }}
          >
            {title}
          </h3>
        )}

        {/* Body excerpt */}
        {shouldTranslate ? (
          <TranslatedText
            as="p"
            className="text-sm leading-relaxed line-clamp-2 mb-3"
            text={translationBody}
            lang={lang}
            sourceType="post_body"
            sourceId={id}
          />
        ) : (
          <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--color-charcoal-lighter)" }}>
            {body}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-[0.6875rem] tracking-wide font-mono" style={{ color: "var(--color-charcoal-lighter)" }}>
          {isAdmin && (
            <>
              <span className="inline-flex items-center gap-1 text-terracotta font-bold uppercase">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-terracotta" />
                {t("post_mod")}
              </span>
              <span aria-hidden="true" className="text-border-light">|</span>
            </>
          )}
          <span>{authorLabel}</span>
          <span aria-hidden="true" className="text-border-light">|</span>
          <span>{new Date(createdAt).toLocaleDateString()}</span>
          {commentCount > 0 && (
            <>
              <span aria-hidden="true" className="text-border-light">|</span>
              <span>{commentCount} {t("post_comments")}</span>
            </>
          )}
          {imageCount > 0 && (
            <>
              <span aria-hidden="true" className="text-border-light">|</span>
              <span>{imageCount} {t("post_photos")}</span>
            </>
          )}
          {isPinned && (
            <>
              <span aria-hidden="true" className="text-border-light">|</span>
              <span className="text-amber-dark font-bold uppercase">{t("post_pinned")}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
