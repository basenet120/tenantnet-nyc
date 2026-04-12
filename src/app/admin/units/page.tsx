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
    <div className="container-wide py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">Administration</p>
        <h1 className="text-3xl tracking-tight">UNIT MANAGEMENT</h1>
      </div>

      <AdminNav current="/admin/units" />

      {loading ? (
        <p className="mt-8 text-sm text-[var(--color-text-secondary)]">Loading units...</p>
      ) : (
        <div className="mt-8 space-y-10">
          {floors.map((floor) => {
            const floorUnits = units.filter((u) => u.floor === floor);
            if (floorUnits.length === 0) return null;
            return (
              <div key={floor}>
                {/* Floor Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-lg text-terracotta">
                    {String(floor).padStart(2, "0")}
                  </span>
                  <h2 className="section-label mb-0 border-b-0 flex-1 border-b-2 border-[var(--color-border)] pb-1">
                    Floor {floor}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {floorUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="card-dark"
                    >
                      {/* Unit Label */}
                      <div className="flex items-baseline justify-between">
                        <p className="font-display text-lg text-offwhite">
                          {unit.label}
                        </p>
                        <span className="badge badge-muted">
                          {unit._count.posts}P / {unit._count.comments}C
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => showQr(unit)}
                          className="btn btn-outline btn-sm"
                        >
                          {qrImages[unit.id] ? "Hide QR" : "Show QR"}
                        </button>
                        <button
                          onClick={() => rotateQr(unit)}
                          className="btn btn-danger btn-sm"
                        >
                          Rotate QR
                        </button>
                      </div>

                      {/* QR Code Display */}
                      {qrImages[unit.id] && (
                        <div className="mt-4 border-t-2 border-[var(--color-border)] pt-4">
                          <div className="bg-offwhite p-3 inline-block">
                            <img
                              src={qrImages[unit.id]}
                              alt={`QR code for ${unit.label}`}
                              width={256}
                              height={256}
                            />
                          </div>
                          <a
                            href={qrImages[unit.id]}
                            download={`qr-${unit.label}.png`}
                            className="mt-2 block text-xs text-terracotta-light hover:text-terracotta"
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
