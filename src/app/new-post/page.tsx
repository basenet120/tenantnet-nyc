"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { IMAGE_LIMITS } from "@/lib/constants";

interface Section {
  id: string;
  name: string;
  slug: string;
  hasIssueTracking: boolean;
}

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data: Section[]) => {
        setSections(data);
        const preselect = searchParams.get("section");
        if (preselect) {
          const match = data.find((s) => s.slug === preselect || s.id === preselect);
          if (match) setSectionId(match.id);
        }
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
        body: JSON.stringify({ title: title.trim(), sectionId, content: content.trim(), imageUrls }),
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
          <h1 className="font-display text-xl uppercase tracking-tight text-offwhite">
            New Post
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
              Section
            </label>
            <select
              id="section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
            >
              <option value="">Select a section...</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="section-label block">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's this about?"
              required
            />
          </div>

          <div>
            <label htmlFor="body" className="section-label block">
              Details
            </label>
            <textarea
              id="body"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the issue or topic..."
              rows={6}
              required
            />
          </div>

          <div>
            <label className="section-label block">Photos</label>
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
            {submitting ? "Posting..." : "Create Post"}
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
