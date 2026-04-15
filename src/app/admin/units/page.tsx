"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import AdminNav from "@/components/admin-nav";
import { useAdminContext } from "@/lib/use-admin-context";
import { useAdminI18n } from "@/components/admin-i18n-provider";
import type { AdminStrings } from "@/lib/get-admin-strings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UnitData = {
  id: string;
  floor: number;
  letter: string;
  label: string;
  qrToken: string;
  _count: { posts: number; comments: number };
};

function RotateQrDialog({
  unit,
  open,
  onOpenChange,
  onConfirm,
  t,
}: {
  unit: UnitData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  t: (key: keyof AdminStrings) => string;
}) {
  if (!unit) return null;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-2 border-[var(--color-danger)] bg-[var(--color-charcoal)] rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl uppercase text-[var(--color-danger)]">
            {t("units_rotate_title")}
          </AlertDialogTitle>
          <div className="h-[2px] w-10 bg-[var(--color-danger)] mt-1" />
          <AlertDialogDescription className="mt-4 text-sm text-[var(--color-offwhite)]">
            You are about to reset the QR code for <strong className="text-[var(--color-offwhite)]">Unit {unit.label}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-charcoal-light)] p-3">
          <p className="text-xs uppercase tracking-wider text-[var(--color-amber)] font-bold mb-2">
            {t("units_rotate_warning")}
          </p>
          <ul className="space-y-1 text-sm text-[var(--color-muted)]">
            <li>{t("units_rotate_w1")}</li>
            <li>{t("units_rotate_w2")}</li>
            <li>{t("units_rotate_w3")}</li>
            <li>{t("units_rotate_w4")}</li>
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="btn btn-outline flex-1 rounded-lg">
            {t("units_cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="btn btn-danger flex-1 rounded-lg">
            {t("units_rotate_qr")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type Density = "compact" | "comfortable" | "expanded";

const DENSITY_KEY = "tn_units_density";

const DENSITY_CLASSES: Record<Density, { grid: string; qr: number }> = {
  compact: {
    grid: "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
    qr: 160,
  },
  comfortable: {
    grid: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
    qr: 200,
  },
  expanded: {
    grid: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
    qr: 256,
  },
};

export default function AdminUnitsPage() {
  const { role, buildingName } = useAdminContext();
  const { t } = useAdminI18n();
  const [units, setUnits] = useState<UnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [confirmUnit, setConfirmUnit] = useState<UnitData | null>(null);
  const [density, setDensity] = useState<Density>("comfortable");

  useEffect(() => {
    fetch("/api/admin/units")
      .then((res) => res.json())
      .then((data) => {
        setUnits(data);
        setLoading(false);
      });
    const saved = typeof window !== "undefined" ? localStorage.getItem(DENSITY_KEY) : null;
    if (saved === "compact" || saved === "comfortable" || saved === "expanded") {
      setDensity(saved);
    }
  }, []);

  function changeDensity(d: Density) {
    setDensity(d);
    if (typeof window !== "undefined") localStorage.setItem(DENSITY_KEY, d);
  }

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
        <p className="section-label border-b-0 mb-1">{t("building_title")}</p>
        <h1 className="text-3xl tracking-tight">{t("units_title")}</h1>
      </div>

      <AdminNav current="/admin/units" role={role} buildingName={buildingName} />

      {/* Density selector */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-[0.625rem] font-display uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
          {t("units_density")}
        </span>
        <div className="flex border-2 border-[var(--color-border)]">
          {(["compact", "comfortable", "expanded"] as Density[]).map((d, i) => (
            <button
              key={d}
              onClick={() => changeDensity(d)}
              className={`px-3 py-1.5 text-[0.625rem] font-display uppercase tracking-wider transition-colors ${
                density === d
                  ? "bg-terracotta text-offwhite"
                  : "text-[var(--color-text-secondary)] hover:text-offwhite"
              } ${i > 0 ? "border-l-2 border-[var(--color-border)]" : ""}`}
            >
              {t(`units_density_${d}` as "units_density_compact" | "units_density_comfortable" | "units_density_expanded")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-[var(--color-text-secondary)]">{t("units_loading")}</p>
      ) : (
        <div className="mt-6 space-y-8">
          {floors.map((floor) => {
            const floorUnits = units.filter((u) => u.floor === floor);
            if (floorUnits.length === 0) return null;
            return (
              <div key={floor}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-display text-lg text-terracotta">
                    {String(floor).padStart(2, "0")}
                  </span>
                  <h2 className="section-label mb-0 border-b-0 flex-1 border-b-2 border-[var(--color-border)] pb-1">
                    Floor {floor}
                  </h2>
                </div>

                <div className={DENSITY_CLASSES[density].grid}>
                  {floorUnits.map((unit) => (
                    <div key={unit.id} className={`card-dark ${density === "compact" ? "p-3" : ""}`}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`font-display text-offwhite ${density === "compact" ? "text-sm" : "text-lg"}`}>
                          {unit.label}
                        </p>
                        {density !== "compact" && (
                          <span className="badge badge-muted whitespace-nowrap">
                            {unit._count.posts}P / {unit._count.comments}C
                          </span>
                        )}
                      </div>

                      <div className={`mt-${density === "compact" ? "2" : "3"} flex ${density === "compact" ? "flex-col" : "flex-wrap"} gap-2`}>
                        <button
                          onClick={() => showQr(unit)}
                          className={`btn btn-outline ${density === "compact" ? "btn-xs text-[0.625rem] px-2 py-1" : "btn-sm"}`}
                        >
                          {qrImages[unit.id] ? t("units_hide_qr") : t("units_show_qr")}
                        </button>
                        {density !== "compact" && (
                          <button
                            onClick={() => setConfirmUnit(unit)}
                            className="btn btn-danger btn-sm"
                          >
                            {t("units_rotate_qr")}
                          </button>
                        )}
                      </div>

                      {density === "compact" && (
                        <button
                          onClick={() => setConfirmUnit(unit)}
                          className="mt-1 w-full text-[0.5625rem] font-display uppercase tracking-wider text-[var(--color-danger)] hover:text-offwhite transition-colors"
                        >
                          {t("units_rotate_qr")}
                        </button>
                      )}

                      {qrImages[unit.id] && (
                        <div className={`mt-${density === "compact" ? "2" : "4"} border-t-2 border-[var(--color-border)] pt-${density === "compact" ? "2" : "4"}`}>
                          <div className="bg-offwhite p-2 inline-block">
                            <img
                              src={qrImages[unit.id]}
                              alt={`QR code for ${unit.label}`}
                              width={DENSITY_CLASSES[density].qr}
                              height={DENSITY_CLASSES[density].qr}
                              style={{ width: "100%", height: "auto", maxWidth: DENSITY_CLASSES[density].qr }}
                            />
                          </div>
                          <a
                            href={qrImages[unit.id]}
                            download={`qr-${unit.label}.png`}
                            className="mt-2 block text-[0.625rem] text-terracotta-light hover:text-terracotta"
                          >
                            {t("units_download_qr")}
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

      <RotateQrDialog
        unit={confirmUnit}
        open={confirmUnit !== null}
        onOpenChange={(o) => { if (!o) setConfirmUnit(null); }}
        onConfirm={() => confirmUnit && rotateQr(confirmUnit)}
        t={t}
      />
    </div>
  );
}
