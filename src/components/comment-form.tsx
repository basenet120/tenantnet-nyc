"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";

function getLangFromCookie(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/tn_lang=([a-z]{2})/);
  return match?.[1] ?? "en";
}

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
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
      toast.success("Comment posted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={3}
        className="w-full rounded-none border-2 border-border bg-charcoal-light text-offwhite placeholder-[var(--color-text-secondary)] px-3 py-3 text-sm focus:border-terracotta focus:outline-none transition-colors"
      />
      <ImageUpload maxImages={3} onImagesChange={setImageUrls} />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="btn btn-primary rounded-none font-display text-[0.8125rem] tracking-[0.08em] uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {submitting ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
}
