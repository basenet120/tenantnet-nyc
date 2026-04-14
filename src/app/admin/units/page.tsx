"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import AdminNav from "@/components/admin-nav";
import { useAdminContext } from "@/lib/use-admin-context";

type UnitData = {
  id: string;
  floor: number;
  letter: string;
  label: string;
  qrToken: string;
  _count: { posts: number; comments: number };
};

function ConfirmModal({
  unit,
  onConfirm,
  onCancel,
}: {
  unit: UnitData;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-sm border-2 border-[var(--color-danger)] bg-[var(--color-charcoal)] p-6">
        <h3 className="font-display text-xl uppercase text-[var(--color-danger)]">
          Rotate QR Code
        </h3>
        <div className="mt-1 h-[2px] w-10 bg-[var(--color-danger)]" />
        <p className="mt-4 text-sm text-[var(--color-offwhite)]">
          You are about to reset the QR code for <strong className="text-[var(--color-offwhite)]">Unit {unit.label}</strong>.
        </p>
        <div className="mt-4 border-2 border-[var(--color-border)] bg-[var(--color-charcoal-light)] p-3">
          <p className="text-xs uppercase tracking-wider text-[var(--color-amber)] font-bold mb-2">This will:</p>
          <ul className="space-y-1 text-sm text-[var(--color-muted)]">
            <li>Invalidate the current QR code sticker</li>
            <li>Log out the tenant immediately</li>
            <li>Require printing a new QR code</li>
            <li>Reset their registration</li>
          </ul>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="btn btn-outline flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger flex-1">
            Rotate QR Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUnitsPage() {
  const { role, buildingName } = useAdminContext();
  const [units, setUnits] = useState<UnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [confirmUnit, setConfirmUnit] = useState<UnitData | null>(null);

  useEffect(() => {
    fetch("/api/admin/units")
      .then((res) => res.json())
      .then((data) => {
        setUnits(data);
        setLoading(false);
      });
  }, []);

  // Get unique floors from the data instead of hardcoding
  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => a - b);

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
    const res = await fetch(`/api/admin/units/${unit.id}/rotate`, {
      method: "POST",
    });
    if (!res.ok) {
      toast.error("Failed to rotate QR code");
      return;
    }
    const { qrToken } = await res.json();
    setUnits((prev) =>
      prev.map((u) => (u.id === unit.id ? { ...u, qrToken } : u)),
    );
    setConfirmUnit(null);
    toast.success(`QR code rotated for ${unit.label}`);
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

      <AdminNav current="/admin/units" role={role} buildingName={buildingName} />

      {loading ? (
        <p className="mt-8 text-sm text-[var(--color-text-secondary)]">Loading units...</p>
      ) : (
        <div className="mt-8 space-y-10">
          {floors.map((floor) => {
            const floorUnits = units.filter((u) => u.floor === floor);
            if (floorUnits.length === 0) return null;
            return (
              <div key={floor}>
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
                    <div key={unit.id} className="card-dark">
                      <div className="flex items-baseline justify-between">
                        <p className="font-display text-lg text-offwhite">
                          {unit.label}
                        </p>
                        <span className="badge badge-muted">
                          {unit._count.posts}P / {unit._count.comments}C
                        </span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => showQr(unit)}
                          className="btn btn-outline btn-sm"
                        >
                          {qrImages[unit.id] ? "Hide QR" : "Show QR"}
                        </button>
                        <button
                          onClick={() => setConfirmUnit(unit)}
                          className="btn btn-danger btn-sm"
                        >
                          Rotate QR
                        </button>
                      </div>

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

      {confirmUnit && (
        <ConfirmModal
          unit={confirmUnit}
          onConfirm={() => rotateQr(confirmUnit)}
          onCancel={() => setConfirmUnit(null)}
        />
      )}
    </div>
  );
}
