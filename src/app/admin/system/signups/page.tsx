"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import SystemAdminNav from "@/components/system-admin-nav";
import { useAdminI18n } from "@/components/admin-i18n-provider";

type Signup = {
  id: string;
  address: string;
  borough: string | null;
  zip: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  unitCount: number | null;
  message: string | null;
  status: string;
  createdAt: string;
};

export default function SignupsPage() {
  const { t } = useAdminI18n();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/system/signups")
      .then((r) => r.json())
      .then((data) => {
        setSignups(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load signups");
        setLoading(false);
      });
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/system/signups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setSignups((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
      toast.success(`Signup ${status}`);
    } else {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="container-wide py-8">
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">{t("system_title")}</p>
        <h1 className="text-3xl tracking-tight">{t("signups_title")}</h1>
      </div>

      <SystemAdminNav current="/admin/system/signups" pendingSignups={signups.filter((s) => s.status === "pending").length} />

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Loading...</p>
        ) : signups.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{t("signups_none")}</p>
        ) : (
          <div className="space-y-3">
            {signups.map((signup) => (
              <div
                key={signup.id}
                className={`card-dark ${signup.status === "pending" ? "border-l-4 border-l-amber" : signup.status === "approved" ? "border-l-4 border-l-sage" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-offwhite">{signup.address}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {signup.contactName} &middot; {signup.contactEmail}
                      {signup.contactPhone && ` &middot; ${signup.contactPhone}`}
                    </p>
                    {signup.borough && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {signup.borough.replace("_", " ")}{signup.zip ? `, ${signup.zip}` : ""}
                        {signup.unitCount ? ` &middot; ${signup.unitCount} units` : ""}
                      </p>
                    )}
                    {signup.message && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-2 italic">
                        &ldquo;{signup.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className={`badge ${
                      signup.status === "pending" ? "badge-amber"
                        : signup.status === "approved" ? "badge-sage"
                        : "badge-muted"
                    }`}>
                      {signup.status}
                    </span>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(signup.createdAt).toLocaleDateString()}
                    </p>
                    {signup.status === "pending" && (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => updateStatus(signup.id, "approved")}
                          className="btn btn-primary btn-sm"
                        >
                          {t("signups_approve")}
                        </button>
                        <button
                          onClick={() => updateStatus(signup.id, "rejected")}
                          className="btn btn-outline btn-sm"
                        >
                          {t("signups_reject")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
