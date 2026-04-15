"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useI18n } from "./i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const { t } = useI18n();
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
      toast.success(isPinned ? t("mod_unpinned") : t("mod_pinned"));
      router.refresh();
    } catch {
      toast.error(t("mod_pin_failed"));
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
      toast.success(t("mod_status_set"));
      router.refresh();
    } catch {
      toast.error(t("mod_status_failed"));
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
      toast.success(t("mod_deleted"));
      router.push("/dashboard");
    } catch {
      toast.error(t("mod_delete_failed"));
      setConfirmDelete(false);
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
        <span className="uppercase-label text-terracotta">{t("mod_tenant_manager")}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Pin toggle */}
        <button
          onClick={handlePin}
          disabled={loading}
          className={`btn btn-sm ${isPinned ? "btn-warning" : "btn-outline"}`}
        >
          {isPinned ? t("mod_unpin") : t("mod_pin")}
        </button>

        {/* Status dropdown */}
        {hasIssueTracking && (
          <Select
            value={status ?? undefined}
            onValueChange={(v) => v && handleStatusChange(v)}
            disabled={loading}
          >
            <SelectTrigger
              className="text-xs uppercase tracking-[0.08em] bg-[var(--color-charcoal)] border-2 border-[var(--color-border)] text-offwhite rounded-none font-display w-auto"
            >
              <SelectValue placeholder={t("mod_set_status")} />
            </SelectTrigger>
            <SelectContent className="bg-[var(--color-charcoal)] border-2 border-[var(--color-border)] rounded-none">
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt}
                  value={opt}
                  className="text-xs uppercase tracking-[0.08em] text-offwhite font-display"
                >
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Delete */}
        <div className="ms-auto flex items-center gap-2">
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
              className="btn btn-sm btn-outline"
            >
              {t("mod_cancel")}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-sm btn-danger"
          >
            {confirmDelete ? t("mod_delete_confirm") : t("mod_delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
