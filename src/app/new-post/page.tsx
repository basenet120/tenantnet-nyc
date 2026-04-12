"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-100">New Post</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="section" className="mb-1 block text-sm font-medium text-zinc-300">
            Section
          </label>
          <select
            id="section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-blue-500 focus:outline-none"
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
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-300">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's this about?"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium text-zinc-300">
            Details
          </label>
          <textarea
            id="body"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe the issue or topic..."
            rows={6}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">Photos</label>
          <ImageUpload
            maxImages={IMAGE_LIMITS.maxPerPost}
            onImagesChange={setImageUrls}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Create Post"}
        </button>
      </form>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-center text-zinc-400">Loading...</div>}>
      <NewPostForm />
    </Suspense>
  );
}
