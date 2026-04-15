"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LanguagePicker } from "@/components/language-picker";
import { useI18n } from "@/components/i18n-provider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError(t("login_error"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 sm:px-6 py-12">
      <div className="fixed top-4 left-4 z-50">
        <LanguagePicker />
      </div>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="font-display text-4xl sm:text-5xl uppercase tracking-tight leading-[0.95]"
            style={{ color: "var(--color-offwhite)" }}
          >
            Tenant
            <br />
            Net<span style={{ color: "var(--color-terracotta)" }}>.NYC</span>
          </h1>
          <div
            className="mt-4 h-[2px] w-16 mx-auto"
            style={{ backgroundColor: "var(--color-terracotta)" }}
          />
          <p
            className="mt-4 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t("login_title")}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-6 px-4 py-3 text-sm"
            style={{
              border: "2px solid var(--color-danger)",
              backgroundColor: "rgba(196, 64, 64, 0.1)",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="font-display"
              style={{
                borderBottom: "none",
                paddingBottom: 0,
                marginBottom: "0.5rem",
                display: "block",
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("login_username_label")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="your_username or email@example.com"
              required
            />
          </div>

          <div>
            <label
              className="font-display"
              style={{
                borderBottom: "none",
                paddingBottom: 0,
                marginBottom: "0.5rem",
                display: "block",
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("login_password_label")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-6"
          >
            {loading ? t("login_signing_in") : t("login_sign_in")}
          </button>
        </form>

        {/* Footer link */}
        <div
          className="mt-8 pt-6 text-center text-sm"
          style={{
            borderTop: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          {t("login_first_time")}{" "}
          <Link href="/" style={{ color: "var(--color-terracotta-light)" }}>
            {t("login_scan_qr")}
          </Link>
        </div>
      </div>
    </div>
  );
}
