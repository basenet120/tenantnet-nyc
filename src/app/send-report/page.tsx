"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LanguagePicker } from "@/components/language-picker";
import { useI18n } from "@/components/i18n-provider";

const QUICK_RECIPIENTS = [
  { labelKey: "report_mgmt" as const, key: "management" },
  { labelKey: "report_hpd" as const, key: "hpd", email: "complaints@hpd.nyc.gov" },
  { labelKey: "report_311" as const, key: "311", email: "311@nyc.gov" },
  { labelKey: "report_custom" as const, key: "custom" },
];

function SendReportForm() {
  const searchParams = useSearchParams();
  const prefillTo = searchParams.get("to") ?? "";

  const [recipientType, setRecipientType] = useState(prefillTo ? "custom" : "");
  const [customEmail, setCustomEmail] = useState(prefillTo);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useI18n();

  function getRecipientEmail(): string {
    if (recipientType === "custom" || recipientType === "management") {
      return customEmail.trim();
    }
    return QUICK_RECIPIENTS.find((r) => r.key === recipientType)?.email ?? "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const to = getRecipientEmail();
    if (!to || !subject.trim() || !message.trim()) {
      toast.error(t("report_error_fields"));
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject: subject.trim(), message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("report_error"));
        return;
      }

      setSent(true);
      toast.success(t("report_success"));
    } catch {
      toast.error(t("report_error"));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-dvh">
        <header className="border-b-2 border-[var(--color-border)] px-4 py-5">
          <div className="container-narrow flex items-center gap-4">
            <Link href="/dashboard" className="text-[var(--color-text-secondary)] hover:text-offwhite transition-colors" aria-label="Back">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <h1 className="font-display text-xl uppercase tracking-tight text-offwhite flex-1">{t("report_title")}</h1>
            <LanguagePicker />
          </div>
        </header>
        <main className="container-narrow py-16 text-center">
          <div className="border-2 border-[var(--color-sage)] p-8 max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-[var(--color-sage)] mb-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="font-display text-lg uppercase text-[var(--color-sage)]">{t("report_sent_title")}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Your report was sent to <strong className="text-offwhite">{getRecipientEmail()}</strong>.
              {" "}{t("report_sent_desc")}
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={() => { setSent(false); setSubject(""); setMessage(""); }} className="btn btn-outline">
                {t("report_send_another")}
              </button>
              <Link href="/dashboard" className="btn btn-primary no-underline">
                {t("report_back")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-[var(--color-border)] px-4 py-5">
        <div className="container-narrow flex items-center gap-4">
          <Link href="/dashboard" className="text-[var(--color-text-secondary)] hover:text-offwhite transition-colors" aria-label="Back">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="font-display text-xl uppercase tracking-tight text-offwhite">{t("report_title")}</h1>
        </div>
      </header>

      <main className="container-narrow py-8">
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {t("report_desc")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient */}
          <div>
            <label className="section-label block">{t("report_send_to")}</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {QUICK_RECIPIENTS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setRecipientType(r.key);
                    if (r.email) setCustomEmail(r.email);
                    else if (r.key !== "custom") setCustomEmail("");
                  }}
                  className={`p-3 text-left border-2 transition-colors text-sm ${
                    recipientType === r.key
                      ? "border-terracotta bg-terracotta/10 text-offwhite"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)]"
                  }`}
                >
                  <span className="font-display text-xs uppercase tracking-wider">{t(r.labelKey)}</span>
                  {r.email && <span className="block text-[0.6875rem] mt-0.5 opacity-60">{r.email}</span>}
                </button>
              ))}
            </div>

            {(recipientType === "custom" || recipientType === "management") && (
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder={recipientType === "management" ? "management@company.com" : "recipient@example.com"}
                required
              />
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="section-label block">{t("report_subject")}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Heat complaint — Unit 3B, 449 W 125th St"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="section-label block">{t("report_message")}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              placeholder={t("report_message_placeholder")}
              required
            />
          </div>

          <div className="border-2 border-[var(--color-border)] bg-[var(--color-charcoal-light)] p-4">
            <p className="text-xs text-[var(--color-text-secondary)]">
              <strong className="text-offwhite">{t("report_how")}</strong> {t("report_how_desc")}
            </p>
          </div>

          <button
            type="submit"
            disabled={sending || !recipientType || !getRecipientEmail()}
            className="btn btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? t("report_sending") : t("report_send")}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function SendReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <p className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wide">Loading...</p>
        </div>
      }
    >
      <SendReportForm />
    </Suspense>
  );
}
