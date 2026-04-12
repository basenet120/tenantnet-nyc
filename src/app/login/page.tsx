"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
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
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
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
            Sign in to your building forum
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
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                )
              }
              placeholder="your_username"
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
              Password
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
            {loading ? "Signing in..." : "Sign In"}
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
          First time?{" "}
          <Link href="/" style={{ color: "var(--color-terracotta-light)" }}>
            Scan the QR code on your apartment door
          </Link>
        </div>
      </div>
    </div>
  );
}
