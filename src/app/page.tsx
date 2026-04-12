import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (session?.type === "unit") {
    redirect("/dashboard");
  }
  if (session?.type === "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TENANTNET.NYC</h1>
        <p className="text-gray-600 mb-6">449 West 125th Street</p>
        <p className="text-sm text-gray-500">
          Scan the QR code on your apartment door to access the building forum.
        </p>
      </div>
    </div>
  );
}
