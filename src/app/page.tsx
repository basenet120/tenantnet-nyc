import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getSession();

  if (session?.type === "unit") {
    redirect("/dashboard");
  }
  if (session?.type === "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="border-2 border-[var(--color-border-light)] p-8 sm:p-12 max-w-lg w-full text-center">
        <h1 className="font-display text-5xl sm:text-7xl uppercase leading-[0.9] tracking-tight text-offwhite mb-6">
          TENANT
          <br />
          NET
          <span className="text-terracotta">.NYC</span>
        </h1>

        <div className="border-t-2 border-b-2 border-[var(--color-border)] py-3 mb-6">
          <p className="font-display text-lg sm:text-xl uppercase tracking-widest text-offwhite">
            449 West 125th Street
          </p>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-[var(--color-text-secondary)] mt-1">
            Harlem, New York
          </p>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Scan the QR code on your apartment door to access the building forum.
        </p>

        <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
          <Link href="/login" className="btn btn-outline w-full">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
