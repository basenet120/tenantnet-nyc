"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import { useI18n } from "./i18n-provider";

function getLangFromCookie(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/tn_lang=([a-z]{2})/);
  return match?.[1] ?? "en";
}

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, imageUrls, language: getLangFromCookie() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }

      setContent("");
      setImageUrls([]);
      router.refresh();
      toast.success(t("comment_posted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("comment_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("comment_placeholder")}
        rows={3}
        className="w-full border-2 border-border bg-charcoal-light text-offwhite placeholder-[var(--color-text-secondary)] px-3 py-3 text-sm focus:border-terracotta focus:outline-none transition-colors"
      />
      <ImageUpload maxImages={3} onImagesChange={setImageUrls} />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="btn btn-primary font-display text-[0.8125rem] tracking-[0.08em] uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {submitting ? t("comment_posting") : t("comment_post")}
      </button>
    </form>
  );
}
