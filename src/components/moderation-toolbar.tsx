"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ModerationToolbarProps = {
  postId: string;
  isPinned: boolean;
  status: string | null;
  hasIssueTracking: boolean;
};

const STATUS_OPTIONS = ["reported", "acknowledged", "fixed", "unresolved"] as const;

export function ModerationToolbar({
  postId,
  isPinned: initialPinned,
  status: initialStatus,
  hasIssueTracking,
}: ModerationToolbarProps) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handlePin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
      if (!res.ok) throw new Error("Failed to update pin status");
      setIsPinned(!isPinned);
      toast.success(isPinned ? "Post unpinned" : "Post pinned");
      router.refresh();
    } catch {
      toast.error("Failed to update pin status");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setStatus(newStatus);
      toast.success(`Status set to ${newStatus}`);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      toast.success("Post deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete post");
      setLoading(false);
    }
  }

  return (
    <div
      className="mt-4 border-2 border-[var(--color-border)] bg-[var(--color-charcoal-light)] p-4"
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-terracotta" />
        <span className="uppercase-label text-terracotta">Tenant Manager</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Pin toggle */}
        <button
          onClick={handlePin}
          disabled={loading}
          className={`btn btn-sm ${isPinned ? "btn-warning" : "btn-outline"}`}
        >
          {isPinned ? "Unpin" : "Pin"}
        </button>

        {/* Status dropdown */}
        {hasIssueTracking && (
          <select
            value={status ?? ""}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={loading}
            className="text-xs uppercase tracking-[0.08em] py-1.5 px-3 bg-[var(--color-charcoal)] border-2 border-[var(--color-border)] text-offwhite"
            style={{ fontFamily: "var(--font-display)", width: "auto" }}
          >
            <option value="" disabled>
              Set status
            </option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {/* Delete */}
        <div className="ml-auto flex items-center gap-2">
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
              className="btn btn-sm btn-outline"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-sm btn-danger"
          >
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
