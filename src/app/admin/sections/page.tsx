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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Section Management
      </h1>

      <AdminNav current="/admin/sections" />

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-gray-500">Loading sections...</p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-gray-500">No sections yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sections.map((section) => (
              <li
                key={section.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {section.name}
                  </p>
                  <p className="text-xs text-gray-500">{section.slug}</p>
                </div>
                <button
                  onClick={() => toggleIssueTracking(section)}
                  className={`rounded px-3 py-1 text-xs font-medium ${
                    section.hasIssueTracking
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Issue Tracking: {section.hasIssueTracking ? "ON" : "OFF"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Add Section</h2>
        <form onSubmit={addSection} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Section name"
              required
            />
            {newName.trim() && (
              <p className="mt-1 text-xs text-gray-400">
                Slug: {generateSlug(newName)}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newIssueTracking}
              onChange={(e) => setNewIssueTracking(e.target.checked)}
            />
            Issue Tracking
          </label>
          <button
            type="submit"
            disabled={adding}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add Section"}
          </button>
        </form>
      </div>
    </div>
  );
}
