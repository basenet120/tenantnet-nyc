"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAdminI18n } from "@/components/admin-i18n-provider";

const BOROUGHS = [
  { value: "manhattan", label: "Manhattan" },
  { value: "bronx", label: "Bronx" },
  { value: "brooklyn", label: "Brooklyn" },
  { value: "queens", label: "Queens" },
  { value: "staten_island", label: "Staten Island" },
];

const BUILDING_TYPES = [
  { value: "rent_stabilized", label: "Rent Stabilized" },
  { value: "market_rate", label: "Market Rate" },
  { value: "coop", label: "Co-op" },
  { value: "condo", label: "Condo" },
  { value: "other", label: "Other" },
];

const AMENITIES_LIST = [
  "Elevator", "Laundry Room", "Roof Access", "Courtyard", "Bike Storage",
  "Package Room", "Doorman", "Gym", "Parking", "Storage Units",
  "Community Room", "Garden",
];

type FormData = {
  address: string;
  borough: string;
  zip: string;
  name: string;
  floors: string;
  totalUnits: string;
  yearBuilt: string;
  buildingType: string;
  block: string;
  lot: string;
  bin: string;
  amenities: string[];
  managementCompany: string;
  managementPhone: string;
  managementEmail: string;
  tenantRepName: string;
  tenantRepEmail: string;
  tenantRepPassword: string;
  unitPattern: string;
};

export default function OnboardWizardPage() {
  const router = useRouter();
  const { t } = useAdminI18n();

  const STEP_TITLES = [
    t("onboard_step_address"),
    t("onboard_step_details"),
    t("onboard_step_nyc"),
    t("onboard_step_amenities"),
    t("onboard_step_management"),
    t("onboard_step_rep"),
    t("onboard_step_review"),
  ];
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    address: "", borough: "manhattan", zip: "", name: "",
    floors: "", totalUnits: "", yearBuilt: "", buildingType: "rent_stabilized",
    block: "", lot: "", bin: "",
    amenities: [],
    managementCompany: "", managementPhone: "", managementEmail: "",
    tenantRepName: "", tenantRepEmail: "", tenantRepPassword: "",
    unitPattern: "floor_letter",
  });

  function update(key: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(amenity: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!form.address.trim() && !!form.borough && !!form.zip.trim();
      case 1: return !!form.floors && !!form.totalUnits;
      case 5: return !!form.tenantRepEmail.trim() && !!form.tenantRepPassword.trim();
      default: return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/system/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || form.address.trim(),
          address: form.address.trim(),
          borough: form.borough,
          zip: form.zip.trim(),
          block: form.block.trim() || undefined,
          lot: form.lot.trim() || undefined,
          bin: form.bin.trim() || undefined,
          floors: parseInt(form.floors),
          totalUnits: parseInt(form.totalUnits),
          yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : undefined,
          buildingType: form.buildingType,
          amenities: form.amenities,
          managementCompany: form.managementCompany.trim() || undefined,
          managementPhone: form.managementPhone.trim() || undefined,
          managementEmail: form.managementEmail.trim() || undefined,
          tenantRepName: form.tenantRepName.trim() || undefined,
          tenantRepEmail: form.tenantRepEmail.trim(),
          tenantRepPassword: form.tenantRepPassword,
          unitPattern: form.unitPattern,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("onboard_failed"));
        return;
      }

      const data = await res.json();
      toast.success(`${data.buildingName} onboarded! ${data.unitCount} units, ${data.recordCount} NYC records.`);
      router.push("/admin/system/buildings");
    } catch {
      toast.error(t("onboard_error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-narrow py-8">
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">{t("system_title")}</p>
        <h1 className="text-3xl tracking-tight">{t("onboard_title")}</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1 mb-8">
        {STEP_TITLES.map((title, i) => (
          <button
            key={i}
            onClick={() => i < step && setStep(i)}
            className={`flex-1 h-1 transition-colors ${
              i <= step ? "bg-terracotta" : "bg-[var(--color-border)]"
            } ${i < step ? "cursor-pointer" : "cursor-default"}`}
            aria-label={`Step ${i + 1}: ${title}`}
          />
        ))}
      </div>
      <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)] mb-6">
        Step {step + 1} of {STEP_TITLES.length}: {STEP_TITLES[step]}
      </p>

      {/* Step content */}
      <div className="card-dark space-y-5">
        {step === 0 && (
          <>
            <div>
              <label>{t("onboard_building_name")}</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. 449 West 125th Street" />
            </div>
            <div>
              <label>{t("onboard_address")} *</label>
              <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="449 West 125th Street" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>{t("onboard_borough")} *</label>
                <select value={form.borough} onChange={(e) => update("borough", e.target.value)} required>
                  {BOROUGHS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label>{t("onboard_zip")} *</label>
                <input type="text" value={form.zip} onChange={(e) => update("zip", e.target.value)} placeholder="10027" required />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>{t("onboard_floors")} *</label>
                <input type="number" value={form.floors} onChange={(e) => update("floors", e.target.value)} min="1" required />
              </div>
              <div>
                <label>{t("onboard_units")} *</label>
                <input type="number" value={form.totalUnits} onChange={(e) => update("totalUnits", e.target.value)} min="1" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>{t("onboard_year")}</label>
                <input type="number" value={form.yearBuilt} onChange={(e) => update("yearBuilt", e.target.value)} placeholder="1920" />
              </div>
              <div>
                <label>{t("onboard_type")}</label>
                <select value={form.buildingType} onChange={(e) => update("buildingType", e.target.value)}>
                  {BUILDING_TYPES.map((bt) => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label>{t("onboard_pattern")}</label>
              <select value={form.unitPattern} onChange={(e) => update("unitPattern", e.target.value)}>
                <option value="floor_letter">{t("onboard_pattern_floor")}</option>
                <option value="sequential">{t("onboard_pattern_seq")}</option>
              </select>
            </div>
          </>
        )}

        {step === 2 && (
          <NycIdentifiersStep
            form={form}
            update={update}
          />
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">{t("onboard_amenities_desc")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES_LIST.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 text-sm text-offwhite cursor-pointer p-2 border-2 border-[var(--color-border)] hover:border-[var(--color-border-light)] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="accent-[var(--color-terracotta)]"
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <label>{t("onboard_mgmt_company")}</label>
              <input type="text" value={form.managementCompany} onChange={(e) => update("managementCompany", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>{t("onboard_mgmt_phone")}</label>
                <input type="tel" value={form.managementPhone} onChange={(e) => update("managementPhone", e.target.value)} />
              </div>
              <div>
                <label>{t("onboard_mgmt_email")}</label>
                <input type="email" value={form.managementEmail} onChange={(e) => update("managementEmail", e.target.value)} />
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              {t("onboard_rep_desc")}
            </p>
            <div>
              <label>{t("onboard_rep_name")}</label>
              <input type="text" value={form.tenantRepName} onChange={(e) => update("tenantRepName", e.target.value)} />
            </div>
            <div>
              <label>{t("onboard_rep_email")} *</label>
              <input type="email" value={form.tenantRepEmail} onChange={(e) => update("tenantRepEmail", e.target.value)} required />
            </div>
            <div>
              <label>{t("onboard_rep_password")} *</label>
              <input type="password" value={form.tenantRepPassword} onChange={(e) => update("tenantRepPassword", e.target.value)} required minLength={8} />
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h3 className="font-display text-lg uppercase text-offwhite">{t("onboard_review_title")}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-secondary)]">{t("onboard_review_address")}</span>
                <span className="text-offwhite">{form.address}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-secondary)]">{t("onboard_review_borough_zip")}</span>
                <span className="text-offwhite">{BOROUGHS.find((b) => b.value === form.borough)?.label}, {form.zip}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-secondary)]">{t("onboard_review_floors")}</span>
                <span className="text-offwhite">{form.floors} floors, {form.totalUnits} units</span>
              </div>
              {(form.block || form.lot || form.bin) && (
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-secondary)]">{t("onboard_review_nyc")}</span>
                  <span className="text-offwhite">
                    {[form.block && `Block ${form.block}`, form.lot && `Lot ${form.lot}`, form.bin && `BIN ${form.bin}`].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {form.managementCompany && (
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-secondary)]">{t("onboard_review_mgmt")}</span>
                  <span className="text-offwhite">{form.managementCompany}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-secondary)]">{t("onboard_review_rep")}</span>
                <span className="text-offwhite">{form.tenantRepEmail}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn btn-outline disabled:opacity-30"
        >
          {t("onboard_back")}
        </button>
        {step < STEP_TITLES.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="btn btn-primary disabled:opacity-30"
          >
            {t("onboard_next")}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary disabled:opacity-50"
          >
            {submitting ? t("onboard_creating") : t("onboard_create")}
          </button>
        )}
      </div>
    </div>
  );
}

function NycIdentifiersStep({
  form,
  update,
}: {
  form: FormData;
  update: (field: keyof FormData, value: string | string[]) => void;
}) {
  const { t } = useAdminI18n();
  const [looking, setLooking] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);

  async function lookupFromAddress() {
    if (!form.address.trim() || !form.borough) {
      toast.error(t("onboard_lookup_error_step1"));
      return;
    }
    setLooking(true);
    try {
      const res = await fetch("/api/admin/system/lookup-bbl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: form.address.trim(), borough: form.borough }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("onboard_lookup_failed"));
        return;
      }
      if (data.block) update("block", data.block);
      if (data.lot) update("lot", data.lot);
      if (data.bin) update("bin", data.bin);
      if (data.yearBuilt && !form.yearBuilt) update("yearBuilt", String(data.yearBuilt));
      if (data.totalUnits && !form.totalUnits) update("totalUnits", String(data.totalUnits));
      if (data.numFloors && !form.floors) update("floors", String(data.numFloors));
      setLookupDone(true);
      toast.success(`Found: Block ${data.block}, Lot ${data.lot}${data.bin ? `, BIN ${data.bin}` : ""}`);
    } catch {
      toast.error(t("onboard_lookup_failed"));
    } finally {
      setLooking(false);
    }
  }

  return (
    <>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {t("onboard_nyc_desc")}
      </p>

      <button
        type="button"
        onClick={lookupFromAddress}
        disabled={looking}
        className="btn btn-outline w-full disabled:opacity-50"
      >
        {looking ? t("onboard_lookup_loading") : lookupDone ? t("onboard_lookup_again") : t("onboard_lookup_btn")}
      </button>

      {lookupDone && (
        <div className="border-2 border-[var(--color-sage)]/30 bg-[var(--color-sage)]/5 px-4 py-3">
          <p className="text-xs text-[var(--color-sage)]">
            {t("onboard_lookup_success")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label>Block</label>
          <input type="text" value={form.block} onChange={(e) => update("block", e.target.value)} placeholder="e.g. 1966" />
        </div>
        <div>
          <label>Lot</label>
          <input type="text" value={form.lot} onChange={(e) => update("lot", e.target.value)} placeholder="e.g. 46" />
        </div>
        <div>
          <label>BIN</label>
          <input type="text" value={form.bin} onChange={(e) => update("bin", e.target.value)} placeholder="e.g. 1059535" />
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)]">
        {t("onboard_lookup_help")}
      </p>
    </>
  );
}
