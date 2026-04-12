"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [unitLabel, setUnitLabel] = useState("");

  function goTo(next: Step) {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
  }

  function validateStep2(): boolean {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = "Invalid email address";
    if (!username.trim()) errors.username = "Username is required";
    else if (!/^[a-z0-9_]{3,20}$/.test(username))
      errors.username = "3-20 characters, lowercase letters, numbers, underscores";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateStep2()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim(),
          username,
          password,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      setUnitLabel(data.unitLabel || "");
      goTo(3);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center gap-0 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className="h-[3px] w-full transition-colors duration-300"
                style={{
                  backgroundColor:
                    s <= step
                      ? "var(--color-terracotta)"
                      : "var(--color-border)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div
            key="step1"
            style={{
              animation: direction === "forward"
                ? "fadeSlideIn 0.35s ease forwards"
                : "fadeSlideInReverse 0.35s ease forwards",
            }}
          >
            <div className="text-center mb-8">
              <h1
                className="font-display text-3xl sm:text-5xl uppercase tracking-tight leading-[0.95]"
                style={{ color: "var(--color-offwhite)" }}
              >
                Welcome to
                <br />
                TenantNet<span style={{ color: "var(--color-terracotta)" }}>.NYC</span>
              </h1>
              <div
                className="mt-4 h-[2px] w-20 mx-auto"
                style={{ backgroundColor: "var(--color-terracotta)" }}
              />
            </div>

            <div
              className="border-t-2 border-b-2 py-3 mb-8 text-center"
              style={{ borderColor: "var(--color-border)" }}
            >
              <p className="font-display text-base sm:text-lg uppercase tracking-widest"
                style={{ color: "var(--color-offwhite)" }}>
                449 West 125th Street
              </p>
              <p
                className="font-display text-xs uppercase mt-1"
                style={{
                  letterSpacing: "0.2em",
                  color: "var(--color-text-secondary)",
                }}
              >
                Harlem, New York
              </p>
            </div>

            <p
              className="text-sm leading-relaxed mb-8"
              style={{ color: "var(--color-text-secondary)" }}
            >
              This is your building&apos;s private forum. Report maintenance issues,
              document landlord disputes, share community news, and keep your
              neighbors informed. Everything here is timestamped and photographed
              &mdash; building a record that matters.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                "Report & track maintenance issues",
                "Document landlord disputes with evidence",
                "Get building bulletins and announcements",
                "Connect with your neighbors",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span
                    className="mt-[2px] w-[6px] h-[6px] shrink-0"
                    style={{ backgroundColor: "var(--color-terracotta)" }}
                  />
                  <span style={{ color: "var(--color-offwhite)" }}>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => goTo(2)}
              className="btn btn-primary w-full"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step 2: Create Account */}
        {step === 2 && (
          <div
            key="step2"
            style={{
              animation: direction === "forward"
                ? "fadeSlideIn 0.35s ease forwards"
                : "fadeSlideInReverse 0.35s ease forwards",
            }}
          >
            <div className="text-center mb-8">
              <h2
                className="font-display text-2xl sm:text-3xl uppercase tracking-tight"
                style={{ color: "var(--color-offwhite)" }}
              >
                Create Your Account
              </h2>
              <div
                className="mt-3 h-[2px] w-16 mx-auto"
                style={{ backgroundColor: "var(--color-terracotta)" }}
              />
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* First Name */}
              <Field
                label="First Name"
                required
                error={fieldErrors.firstName}
              >
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </Field>

              {/* Email */}
              <Field label="Email" required error={fieldErrors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </Field>

              {/* Username */}
              <Field label="Username" required error={fieldErrors.username}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                    )
                  }
                  placeholder="your_username"
                  minLength={3}
                  maxLength={20}
                />
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  3-20 characters, lowercase letters, numbers, underscores
                </p>
              </Field>

              {/* Password */}
              <Field label="Password" required error={fieldErrors.password}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </Field>

              {/* Confirm Password */}
              <Field
                label="Confirm Password"
                required
                error={fieldErrors.confirmPassword}
              >
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                />
              </Field>

              {/* Optional divider */}
              <div className="flex items-center gap-3 py-2">
                <div
                  className="h-[1px] flex-1"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
                <span
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Optional
                </span>
                <div
                  className="h-[1px] flex-1"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
              </div>

              {/* Last Name */}
              <Field label="Last Name">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </Field>

              {/* Phone */}
              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </Field>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="btn btn-outline"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div
            key="step3"
            className="text-center"
            style={{
              animation: "fadeSlideIn 0.35s ease forwards",
            }}
          >
            <div
              className="w-14 h-14 mx-auto mb-6 flex items-center justify-center"
              style={{
                border: "2px solid var(--color-sage)",
                color: "var(--color-sage)",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2
              className="font-display text-2xl sm:text-3xl uppercase tracking-tight mb-4"
              style={{ color: "var(--color-offwhite)" }}
            >
              You&apos;re all set, {firstName}!
            </h2>

            {unitLabel && (
              <p
                className="text-sm mb-6"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Your unit is <strong style={{ color: "var(--color-offwhite)" }}>Unit {unitLabel}</strong>.
                This is your home on TENANTNET.NYC.
              </p>
            )}

            <div
              className="text-left p-5 mb-8"
              style={{
                border: "2px solid var(--color-border)",
                backgroundColor: "var(--color-charcoal-light)",
              }}
            >
              <p
                className="font-display text-xs uppercase tracking-widest mb-4"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Quick Tips
              </p>
              <ul className="space-y-3">
                {[
                  "Post issues with photos for evidence",
                  "Check Bulletins for building updates",
                  "Your posts are timestamped and documented",
                ].map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-3 text-sm"
                    style={{ color: "var(--color-offwhite)" }}
                  >
                    <span
                      className="mt-[2px] w-[6px] h-[6px] shrink-0"
                      style={{ backgroundColor: "var(--color-terracotta)" }}
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="btn btn-primary w-full"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeSlideInReverse {
          from {
            opacity: 0;
            transform: translateX(-24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
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
          textTransform: "uppercase" as const,
          color: "var(--color-text-secondary)",
        }}
      >
        {label}{" "}
        {required && <span style={{ color: "var(--color-terracotta)" }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
