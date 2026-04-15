"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LanguagePicker } from "@/components/language-picker";
import { useAdminI18n } from "@/components/admin-i18n-provider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useAdminI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Login failed";
        setError(msg);
        toast.error(msg);
        return;
      }

      const data = await res.json();
      // Redirect based on role
      if (data.role === "system_admin") {
        router.push("/admin/system");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="fixed top-4 left-4 z-50">
        <LanguagePicker />
      </div>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="section-label border-b-0 mb-2 text-[var(--color-text-secondary)]">
            TENANTNET.NYC
          </p>
          <h1 className="text-4xl tracking-tight">{t("manager_login_title")}</h1>
          <div className="mt-3 mx-auto w-12 h-[2px] bg-[var(--color-terracotta)]" />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 border-2 border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email">{t("manager_login_email")}</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tenantnet.nyc"
            />
          </div>

          <div>
            <label htmlFor="password">{t("manager_login_password")}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? t("manager_login_authenticating") : t("manager_login_sign_in")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
          {t("manager_login_authorized")}
        </p>
      </div>
    </div>
  );
}
