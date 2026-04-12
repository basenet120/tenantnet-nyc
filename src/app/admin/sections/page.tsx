"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/admin-nav";

type Section = {
  id: string;
  name: string;
  slug: string;
  hasIssueTracking: boolean;
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newIssueTracking, setNewIssueTracking] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data) => {
        setSections(data);
        setLoading(false);
      });
  }, []);

  async function toggleIssueTracking(section: Section) {
    const res = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: section.id,
        hasIssueTracking: !section.hasIssueTracking,
      }),
    });

    if (res.ok) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === section.id
            ? { ...s, hasIssueTracking: !s.hasIssueTracking }
            : s,
        ),
      );
    }
  }

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);
    const slug = generateSlug(newName);

    const res = await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        slug,
        hasIssueTracking: newIssueTracking,
      }),
    });

    if (res.ok) {
      const section = await res.json();
      setSections((prev) => [...prev, section]);
      setNewName("");
      setNewIssueTracking(false);
    }
    setAdding(false);
  }

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">Administration</p>
        <h1 className="text-3xl tracking-tight">SECTIONS</h1>
      </div>

      <AdminNav current="/admin/sections" />

      {/* Section List */}
      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Loading sections...</p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">No sections yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {sections.map((section) => (
              <li
                key={section.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-offwhite">
                    {section.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    /{section.slug}
                  </p>
                </div>
                <button
                  onClick={() => toggleIssueTracking(section)}
                  className={`btn btn-sm ${
                    section.hasIssueTracking ? "btn-primary" : "btn-outline"
                  }`}
                >
                  Issue Tracking: {section.hasIssueTracking ? "ON" : "OFF"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Section */}
      <div className="mt-10">
        <h2 className="section-label">Add Section</h2>
        <form onSubmit={addSection} className="card-dark">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label>Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Section name"
                required
              />
              {newName.trim() && (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Slug: <span className="text-terracotta-light">{generateSlug(newName)}</span>
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer pb-1">
              <input
                type="checkbox"
                checked={newIssueTracking}
                onChange={(e) => setNewIssueTracking(e.target.checked)}
                className="accent-[var(--color-terracotta)]"
              />
              Issue Tracking
            </label>
            <button
              type="submit"
              disabled={adding}
              className="btn btn-primary disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
