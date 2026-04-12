"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/admin-nav";
import { POST_STATUS } from "@/lib/constants";

type Section = {
  id: string;
  name: string;
  slug: string;
  hasIssueTracking: boolean;
};

type Post = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  status: string | null;
  createdAt: string;
  section: Section;
  unit: { label: string } | null;
  admin: { email: string } | null;
};

export default function ModerationPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [bulletinTitle, setBulletinTitle] = useState("");
  const [bulletinBody, setBulletinBody] = useState("");
  const [bulletinSectionId, setBulletinSectionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [postsRes, sectionsRes] = await Promise.all([
        fetch("/api/admin/posts"),
        fetch("/api/sections"),
      ]);
      const postsData = await postsRes.json();
      const sectionsData = await sectionsRes.json();
      setPosts(postsData);
      setSections(sectionsData);

      const bulletinsSection = sectionsData.find(
        (s: Section) => s.slug === "bulletins",
      );
      if (bulletinsSection) setBulletinSectionId(bulletinsSection.id);

      setLoading(false);
    }
    load();
  }, []);

  async function handleCreateBulletin(e: React.FormEvent) {
    e.preventDefault();
    if (!bulletinTitle.trim() || !bulletinBody.trim() || !bulletinSectionId)
      return;

    setSubmitting(true);
    const res = await fetch("/api/admin/bulletin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bulletinTitle,
        content: bulletinBody,
        sectionId: bulletinSectionId,
      }),
    });

    if (res.ok) {
      setBulletinTitle("");
      setBulletinBody("");
      const postsRes = await fetch("/api/admin/posts");
      setPosts(await postsRes.json());
    }
    setSubmitting(false);
  }

  async function togglePin(post: Post) {
    await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !post.isPinned }),
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, isPinned: !p.isPinned } : p,
      ),
    );
  }

  async function changeStatus(postId: string, status: string) {
    await fetch(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status } : p)),
    );
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;

    await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Moderation</h1>
        <AdminNav current="/admin/moderation" />
        <p className="mt-8 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Moderation</h1>
      <AdminNav current="/admin/moderation" />

      {/* Create Bulletin */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Create Bulletin</h2>
        <form onSubmit={handleCreateBulletin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={bulletinTitle}
              onChange={(e) => setBulletinTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Body
            </label>
            <textarea
              value={bulletinBody}
              onChange={(e) => setBulletinBody(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Section
            </label>
            <select
              value={bulletinSectionId}
              onChange={(e) => setBulletinSectionId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
              required
            >
              <option value="">Select section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Bulletin"}
          </button>
        </form>
      </div>

      {/* Posts List */}
      <h2 className="mt-10 mb-4 text-lg font-semibold">All Posts</h2>
      {posts.length === 0 ? (
        <p className="text-sm text-gray-500">No posts yet.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {post.isPinned && (
                      <span className="mr-1 text-amber-500" title="Pinned">
                        &#x1f4cc;
                      </span>
                    )}
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {post.unit?.label ?? post.admin?.email ?? "Unknown"} in{" "}
                    {post.section.name} &middot;{" "}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => togglePin(post)}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      post.isPinned
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {post.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Status buttons for issue-tracking sections */}
              {post.section.hasIssueTracking && (
                <div className="mt-3 flex gap-2">
                  {POST_STATUS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(post.id, s)}
                      className={`rounded px-2 py-1 text-xs font-medium capitalize ${
                        post.status === s
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
