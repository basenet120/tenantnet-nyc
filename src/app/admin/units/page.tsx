"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import AdminNav from "@/components/admin-nav";

type UnitData = {
  id: string;
  floor: number;
  letter: string;
  label: string;
  qrToken: string;
  _count: { posts: number; comments: number };
};

export default function AdminUnitsPage() {
  const [units, setUnits] = useState<UnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/units")
      .then((res) => res.json())
      .then((data) => {
        setUnits(data);
        setLoading(false);
      });
  }, []);

  const floors = [1, 2, 3, 4, 5];

  async function showQr(unit: UnitData) {
    if (qrImages[unit.id]) {
      setQrImages((prev) => {
        const next = { ...prev };
        delete next[unit.id];
        return next;
      });
      return;
    }
    const url = `${window.location.origin}/auth/${unit.qrToken}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 });
    setQrImages((prev) => ({ ...prev, [unit.id]: dataUrl }));
  }

  async function rotateQr(unit: UnitData) {
    if (!confirm(`Rotate QR token for ${unit.label}? All current sessions for this unit will be invalidated.`)) {
      return;
    }
    const res = await fetch(`/api/admin/units/${unit.id}/rotate`, {
      method: "POST",
    });
    if (!res.ok) return;
    const { qrToken } = await res.json();
    setUnits((prev) =>
      prev.map((u) => (u.id === unit.id ? { ...u, qrToken } : u)),
    );
    // Regenerate QR image if it was showing
    if (qrImages[unit.id]) {
      const url = `${window.location.origin}/auth/${qrToken}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 });
      setQrImages((prev) => ({ ...prev, [unit.id]: dataUrl }));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Unit Management</h1>
      <AdminNav current="/admin/units" />

      {loading ? (
        <p className="mt-8 text-sm text-gray-500">Loading units...</p>
      ) : (
        <div className="mt-8 space-y-10">
          {floors.map((floor) => {
            const floorUnits = units.filter((u) => u.floor === floor);
            if (floorUnits.length === 0) return null;
            return (
              <div key={floor}>
                <h2 className="mb-4 text-lg font-semibold text-gray-700">
                  Floor {floor}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {floorUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <p className="text-sm font-bold text-gray-900">
                        {unit.label}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {unit._count.posts} posts &middot;{" "}
                        {unit._count.comments} comments
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => showQr(unit)}
                          className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                        >
                          {qrImages[unit.id] ? "Hide QR" : "Show QR"}
                        </button>
                        <button
                          onClick={() => rotateQr(unit)}
                          className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Rotate QR
                        </button>
                      </div>
                      {qrImages[unit.id] && (
                        <div className="mt-3">
                          <img
                            src={qrImages[unit.id]}
                            alt={`QR code for ${unit.label}`}
                            className="mx-auto"
                            width={256}
                            height={256}
                          />
                          <a
                            href={qrImages[unit.id]}
                            download={`qr-${unit.label}.png`}
                            className="mt-2 block text-center text-xs text-blue-600 hover:underline"
                          >
                            Download QR Code
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
