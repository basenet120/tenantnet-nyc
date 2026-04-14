"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

type Settings = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  label: string;
  notifyNewPosts: boolean;
  notifyComments: boolean;
  notifyStatusChange: boolean;
  notifyBulletins: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification toggles
  const [notifyNewPosts, setNotifyNewPosts] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyStatusChange, setNotifyStatusChange] = useState(true);
  const [notifyBulletins, setNotifyBulletins] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load settings");
        return r.json();
      })
      .then((data: Settings) => {
        setSettings(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setUsername(data.username || "");
        setPhone(data.phone || "");
        setNotifyNewPosts(data.notifyNewPosts);
        setNotifyComments(data.notifyComments);
        setNotifyStatusChange(data.notifyStatusChange);
        setNotifyBulletins(data.notifyBulletins);
        setLoading(false);
      })
      .catch(() => {
        toast.error(t("settings_load_error"));
        setLoading(false);
      });
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, username, phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("settings_error"));
        return;
      }
      toast.success(t("settings_profile_updated"));
    } catch {
      toast.error(t("settings_error"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("settings_passwords_mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("settings_password_length"));
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("settings_error"));
        return;
      }
      toast.success(t("settings_password_changed"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error(t("settings_error"));
    } finally {
      setSavingPassword(false);
    }
  }

  async function saveNotifications() {
    setSavingNotifications(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyNewPosts,
          notifyComments,
          notifyStatusChange,
          notifyBulletins,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("settings_error"));
        return;
      }
      toast.success(t("settings_prefs_saved"));
    } catch {
      toast.error(t("settings_error"));
    } finally {
      setSavingNotifications(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="border-b-2 px-4 py-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-charcoal-light)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Back to dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-xl uppercase tracking-tight" style={{ color: "var(--color-offwhite)" }}>
              {t("settings_title")}
            </h1>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Unit {settings?.label}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">

        {/* ── PROFILE ── */}
        <section>
          <h2
            className="font-display text-sm uppercase tracking-widest pb-2 mb-6 border-b-2"
            style={{ color: "var(--color-terracotta)", borderColor: "var(--color-border)" }}
          >
            {t("settings_profile")}
          </h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
                  {t("settings_first_name")} <span style={{ color: "var(--color-terracotta)" }}>*</span>
                </label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
                  {t("settings_last_name")}
                </label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
                {t("settings_email")} <span style={{ color: "var(--color-terracotta)" }}>*</span>
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
                  {t("settings_username")} <span style={{ color: "var(--color-terracotta)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
                  {t("settings_phone")}
                </label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
              </div>
            </div>

            <button type="submit" disabled={savingProfile} className="btn btn-primary">
              {savingProfile ? t("settings_saving") : t("settings_save_profile")}
            </button>
          </form>
        </section>

        {/* ── PASSWORD ── */}
        <section>
          <h2
            className="font-display text-sm uppercase tracking-widest pb-2 mb-6 border-b-2"
            style={{ color: "var(--color-terracotta)", borderColor: "var(--color-border)" }}
          >
            {t("settings_change_password")}
          </h2>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
                {t("settings_current_password")}
              </label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
                  {t("settings_new_password")}
                </label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
                  {t("settings_confirm_password")}
                </label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" disabled={savingPassword} className="btn btn-outline">
              {savingPassword ? t("settings_changing") : t("settings_change_password")}
            </button>
          </form>
        </section>

        {/* ── NOTIFICATIONS ── */}
        <section>
          <h2
            className="font-display text-sm uppercase tracking-widest pb-2 mb-6 border-b-2"
            style={{ color: "var(--color-terracotta)", borderColor: "var(--color-border)" }}
          >
            {t("settings_notifications")}
          </h2>
          <div className="space-y-4">
            <NotificationToggle
              label={t("settings_notify_posts")}
              description={t("settings_notify_posts_desc")}
              checked={notifyNewPosts}
              onChange={setNotifyNewPosts}
            />
            <NotificationToggle
              label={t("settings_notify_comments")}
              description={t("settings_notify_comments_desc")}
              checked={notifyComments}
              onChange={setNotifyComments}
            />
            <NotificationToggle
              label={t("settings_notify_status")}
              description={t("settings_notify_status_desc")}
              checked={notifyStatusChange}
              onChange={setNotifyStatusChange}
            />
            <NotificationToggle
              label={t("settings_notify_bulletins")}
              description={t("settings_notify_bulletins_desc")}
              checked={notifyBulletins}
              onChange={setNotifyBulletins}
            />

            <button
              onClick={saveNotifications}
              disabled={savingNotifications}
              className="btn btn-primary"
            >
              {savingNotifications ? t("settings_saving") : t("settings_save_prefs")}
            </button>
          </div>
        </section>

        {/* ── LOGOUT ── */}
        <section>
          <h2
            className="font-display text-sm uppercase tracking-widest pb-2 mb-6 border-b-2"
            style={{ color: "var(--color-danger)", borderColor: "var(--color-border)" }}
          >
            {t("settings_account")}
          </h2>
          <div
            className="flex items-center justify-between p-4 border-2"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-charcoal-light)" }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-offwhite)" }}>{t("settings_logout")}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                {t("settings_logout_desc")}
              </p>
            </div>
            <button
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                  toast.success(t("settings_logged_out"));
                  router.push("/");
                } catch {
                  toast.error(t("settings_error"));
                  setLoggingOut(false);
                }
              }}
              disabled={loggingOut}
              className="btn btn-danger btn-sm"
            >
              {loggingOut ? t("settings_logging_out") : t("settings_logout")}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 border-2"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-charcoal-light)",
      }}
    >
      <div>
        <p className="text-sm font-bold" style={{ color: "var(--color-offwhite)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-12 h-6 transition-colors shrink-0 ml-4"
        style={{
          backgroundColor: checked ? "var(--color-terracotta)" : "var(--color-charcoal-lighter)",
          border: "2px solid",
          borderColor: checked ? "var(--color-terracotta)" : "var(--color-border)",
        }}
        aria-label={`${label}: ${checked ? "on" : "off"}`}
      >
        <span
          className="block w-4 h-4 transition-transform"
          style={{
            backgroundColor: "var(--color-offwhite)",
            transform: checked ? "translateX(22px)" : "translateX(2px)",
          }}
        />
      </button>
    </div>
  );
}
