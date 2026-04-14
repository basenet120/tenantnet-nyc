"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { useI18n } from "@/components/i18n-provider";
import { IMAGE_LIMITS } from "@/lib/constants";

interface Section {
  id: string;
  name: string;
  slug: string;
  hasIssueTracking: boolean;
}

function NewPostForm() {
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sections")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load sections");
        return res.json();
      })
      .then((data: Section[]) => {
        setSections(data);
        const preselect = searchParams.get("section");
        if (preselect) {
          const match = data.find((s) => s.slug === preselect || s.id === preselect);
          if (match) setSectionId(match.id);
        }
      })
      .catch(() => {
        setError("Failed to load sections. Please refresh the page.");
      });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!sectionId || !title.trim() || !content.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          sectionId,
          content: content.trim(),
          imageUrls,
          visibility,
          language: document.cookie.match(/tn_lang=([a-z]{2})/)?.[1] ?? "en",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post");
      }

      const data = await res.json();
      router.push(`/post/${data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="border-b-2 border-[var(--color-border)] px-4 py-5">
        <div className="container-narrow flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[var(--color-text-secondary)] hover:text-offwhite transition-colors"
            aria-label="Back to dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <h1 className="font-display text-xl uppercase tracking-tight text-offwhite flex-1">
            {t("new_post_title")}
          </h1>
        </div>
      </header>

      <main className="container-narrow py-8">
        {error && (
          <div className="mb-6 border-2 border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="section" className="section-label block">
              {t("new_post_section_label")}
            </label>
            <select
              id="section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
            >
              <option value="">{t("new_post_section_placeholder")}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="section-label block">
              {t("new_post_title_label")}
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("new_post_title_placeholder")}
              required
            />
          </div>

          <div>
            <label htmlFor="body" className="section-label block">
              {t("new_post_details_label")}
            </label>
            <textarea
              id="body"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("new_post_details_placeholder")}
              rows={6}
              required
            />
          </div>

          <div>
            <label className="section-label block">{t("new_post_visibility")}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-offwhite cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="accent-[var(--color-terracotta)]"
                />
                {t("new_post_public")}
              </label>
              <label className="flex items-center gap-2 text-sm text-offwhite cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="accent-[var(--color-terracotta)]"
                />
                {t("new_post_private")}
              </label>
            </div>
          </div>

          <div>
            <label className="section-label block">{t("new_post_photos")}</label>
            <ImageUpload
              maxImages={IMAGE_LIMITS.maxPerPost}
              onImagesChange={setImageUrls}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? t("new_post_posting") : t("new_post_create")}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <p className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wide">
            Loading...
          </p>
        </div>
      }
    >
      <NewPostForm />
    </Suspense>
  );
}
