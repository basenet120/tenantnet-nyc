"use client";

import { useState, useEffect } from "react";

/**
 * Displays text translated to the user's preferred language.
 * Shows original text immediately, then swaps in translation.
 * Props:
 *  - text: the English (or original) text to display
 *  - lang: the viewer's preferred language
 *  - sourceType/sourceId: for cache keying
 *  - as: wrapper element (default "span")
 */
export function TranslatedText({
  text,
  lang,
  sourceType,
  sourceId,
  as: Tag = "span",
  className,
}: {
  text: string;
  lang: string;
  sourceType: string;
  sourceId: string;
  as?: "span" | "p" | "div" | "h2" | "h3";
  className?: string;
}) {
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (lang === "en" || !text.trim()) {
      setTranslated(text);
      return;
    }

    // Check localStorage cache first
    const cacheKey = `tn_t_${lang}_${sourceType}_${sourceId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setTranslated(cached);
      return;
    }

    let cancelled = false;

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, toLang: lang, sourceType, sourceId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.translated) {
          setTranslated(data.translated);
          localStorage.setItem(cacheKey, data.translated);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [text, lang, sourceType, sourceId]);

  return <Tag className={className}>{translated}</Tag>;
}
