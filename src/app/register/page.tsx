"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, username, phone }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
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
          <h1 className="font-display text-4xl uppercase tracking-tight text-[var(--color-offwhite)]">
            Welcome
          </h1>
          <div className="mt-3 h-[2px] w-16 mx-auto bg-[var(--color-terracotta)]" />
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Set up your profile to join the building forum
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 border-2 border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Required fields */}
          <div>
            <label className="section-label" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "0.5rem", display: "block", fontSize: "0.7rem" }}>
              First Name <span className="text-[var(--color-terracotta)]">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              required
            />
          </div>

          <div>
            <label className="section-label" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "0.5rem", display: "block", fontSize: "0.7rem" }}>
              Email <span className="text-[var(--color-terracotta)]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="section-label" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "0.5rem", display: "block", fontSize: "0.7rem" }}>
              Username <span className="text-[var(--color-terracotta)]">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="your_username"
              minLength={3}
              maxLength={20}
              required
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              3-20 characters, lowercase letters, numbers, underscores
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="h-[1px] flex-1 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-muted)] uppercase tracking-widest">Optional</span>
            <div className="h-[1px] flex-1 bg-[var(--color-border)]" />
          </div>

          <div>
            <label className="section-label" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "0.5rem", display: "block", fontSize: "0.7rem" }}>
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
            />
          </div>

          <div>
            <label className="section-label" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "0.5rem", display: "block", fontSize: "0.7rem" }}>
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-6"
          >
            {loading ? "Setting up..." : "Join the Forum"}
          </button>
        </form>
      </div>
    </div>
  );
}
