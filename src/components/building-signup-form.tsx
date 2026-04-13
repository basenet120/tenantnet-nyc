"use client";

import { useState, FormEvent } from "react";
import { toast } from "sonner";

const BOROUGHS = [
  { value: "manhattan", label: "Manhattan" },
  { value: "bronx", label: "Bronx" },
  { value: "brooklyn", label: "Brooklyn" },
  { value: "queens", label: "Queens" },
  { value: "staten_island", label: "Staten Island" },
];

export function BuildingSignupForm() {
  const [address, setAddress] = useState("");
  const [borough, setBorough] = useState("");
  const [zip, setZip] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [unitCount, setUnitCount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/building-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          borough: borough || undefined,
          zip: zip.trim() || undefined,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          unitCount: unitCount ? parseInt(unitCount) : undefined,
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit");
        return;
      }

      setSubmitted(true);
      toast.success("Request submitted! We'll be in touch.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="border-2 border-[var(--color-sage)] p-6 text-center">
        <p className="font-display text-lg uppercase text-[var(--color-sage)]">Request Received</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
          We&apos;ll review your submission and reach out soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
          Building Address <span style={{ color: "var(--color-terracotta)" }}>*</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 West 125th Street"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>Borough</label>
          <select value={borough} onChange={(e) => setBorough(e.target.value)}>
            <option value="">Select...</option>
            {BOROUGHS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>ZIP Code</label>
          <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="10027" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
            Your Name <span style={{ color: "var(--color-terracotta)" }}>*</span>
          </label>
          <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
            Email <span style={{ color: "var(--color-terracotta)" }}>*</span>
          </label>
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>Phone</label>
          <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>Units in Building</label>
          <input type="number" value={unitCount} onChange={(e) => setUnitCount(e.target.value)} min="1" />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Tell us about your building..." />
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary w-full disabled:opacity-50">
        {submitting ? "Submitting..." : "Request TENANTNET for My Building"}
      </button>
    </form>
  );
}
