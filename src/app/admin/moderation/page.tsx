"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminNav from "@/components/admin-nav";
import { POST_STATUS } from "@/lib/constants";
import { useAdminContext } from "@/lib/use-admin-context";

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
  admin: { email: string; name: string | null; role: string } | null;
};

export default function ModerationPage() {
  const { role, buildingName } = useAdminContext();
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
      toast.success("Bulletin created");
    } else {
      toast.error("Failed to create bulletin");
    }
    setSubmitting(false);
  }

  async function togglePin(post: Post) {
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !post.isPinned }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, isPinned: !p.isPinned } : p,
        ),
      );
      toast.success(post.isPinned ? "Post unpinned" : "Post pinned");
    } else {
      toast.error("Failed to update pin status");
    }
  }

  async function changeStatus(postId: string, status: string) {
    const res = await fetch(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status } : p)),
      );
      toast.success(`Status changed to ${status}`);
    } else {
      toast.error("Failed to change status");
    }
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;

    const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted");
    } else {
      toast.error("Failed to delete post");
    }
  }

  function postAuthorLabel(post: Post) {
    if (post.admin) {
      const tag = post.admin.role === "system_admin" ? "System Admin"
        : post.admin.role === "tenant_rep" ? "Tenant Rep"
        : post.admin.role === "mgmt_rep" ? "Mgmt Rep"
        : "Admin";
      return post.admin.name ? `${post.admin.name} (${tag})` : post.admin.email;
    }
    return post.unit?.label ?? "Unknown";
  }

  if (loading) {
    return (
      <div className="container-wide py-8">
        <div className="mb-6">
          <p className="section-label border-b-0 mb-1">Administration</p>
          <h1 className="text-3xl tracking-tight">MODERATION</h1>
        </div>
        <AdminNav current="/admin/moderation" role={role} buildingName={buildingName} />
        <p className="mt-8 text-sm text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">Administration</p>
        <h1 className="text-3xl tracking-tight">MODERATION</h1>
      </div>

      <AdminNav current="/admin/moderation" role={role} buildingName={buildingName} />

      {/* Create Bulletin */}
      <div className="mt-8 card-dark border-l-[3px] border-l-terracotta">
        <h2 className="font-display text-lg uppercase tracking-wide text-offwhite mb-4">
          Create Bulletin
        </h2>
        <form onSubmit={handleCreateBulletin} className="space-y-4">
          <div>
            <label>Title</label>
            <input
              type="text"
              value={bulletinTitle}
              onChange={(e) => setBulletinTitle(e.target.value)}
              placeholder="Bulletin title"
              required
            />
          </div>
          <div>
            <label>Body</label>
            <textarea
              value={bulletinBody}
              onChange={(e) => setBulletinBody(e.target.value)}
              rows={3}
              placeholder="Write your bulletin..."
              required
            />
          </div>
          <div>
            <label>Section</label>
            <select
              value={bulletinSectionId}
              onChange={(e) => setBulletinSectionId(e.target.value)}
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
            className="btn btn-primary disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Bulletin"}
          </button>
        </form>
      </div>

      {/* Posts List */}
      <div className="mt-10">
        <h2 className="section-label">All Posts</h2>

        {posts.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">No posts yet.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className={`card-dark ${post.isPinned ? "pinned-accent" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {post.isPinned && (
                        <span className="badge badge-amber">Pinned</span>
                      )}
                      <p className="text-sm font-semibold text-offwhite truncate">
                        {post.title}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {postAuthorLabel(post)} in{" "}
                      <span className="text-terracotta-light">{post.section.name}</span>
                      {" "}&middot;{" "}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => togglePin(post)}
                      className={`btn btn-sm ${
                        post.isPinned ? "btn-warning" : "btn-outline"
                      }`}
                    >
                      {post.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Status buttons for issue-tracking sections */}
                {post.section.hasIssueTracking && (
                  <div className="mt-3 flex gap-0 border-2 border-[var(--color-border)] inline-flex">
                    {POST_STATUS.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(post.id, s)}
                        className={`px-3 py-1.5 text-xs font-display uppercase tracking-wider transition-colors ${
                          post.status === s
                            ? "bg-terracotta text-offwhite"
                            : "text-[var(--color-text-secondary)] hover:text-offwhite hover:bg-charcoal-lighter"
                        } ${s !== POST_STATUS[0] ? "border-l-2 border-[var(--color-border)]" : ""}`}
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
    </div>
  );
}
