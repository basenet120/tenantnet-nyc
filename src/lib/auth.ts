import { cookies } from "next/headers";
import { prisma } from "./db";
import { COOKIE_NAME, SESSION_DURATION_DAYS } from "./constants";
import { randomBytes } from "crypto";

export type SessionData =
  | { type: "unit"; unitId: string; unitLabel: string; buildingId: string; isRegistered: boolean }
  | { type: "admin"; adminId: string; email: string; role: "system_admin"; buildingId: null; name: string | null }
  | { type: "admin"; adminId: string; email: string; role: "tenant_rep" | "mgmt_rep"; buildingId: string; name: string | null }
  | null;

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      unit: { select: { id: true, label: true, buildingId: true, isRegistered: true } },
      admin: { select: { id: true, email: true, role: true, buildingId: true, name: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;

  if (session.unit) {
    return {
      type: "unit",
      unitId: session.unit.id,
      unitLabel: session.unit.label,
      buildingId: session.unit.buildingId,
      isRegistered: session.unit.isRegistered,
    };
  }
  if (session.admin) {
    if (session.admin.role === "system_admin") {
      return {
        type: "admin",
        adminId: session.admin.id,
        email: session.admin.email,
        role: "system_admin",
        buildingId: null,
        name: session.admin.name,
      };
    }
    return {
      type: "admin",
      adminId: session.admin.id,
      email: session.admin.email,
      role: session.admin.role as "tenant_rep" | "mgmt_rep",
      buildingId: session.admin.buildingId!,
      name: session.admin.name,
    };
  }
  return null;
}

export async function requireUnit() {
  const session = await getSession();
  if (!session || session.type !== "unit") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireSystemAdmin() {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireTenantRep() {
  const session = await getSession();
  if (!session || session.type !== "admin" || (session.role !== "tenant_rep" && session.role !== "system_admin")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireBuildingAdmin(buildingId: string) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    throw new Error("Unauthorized");
  }
  if (session.role === "system_admin") return session;
  if (session.role === "tenant_rep" && session.buildingId === buildingId) return session;
  throw new Error("Unauthorized");
}

export async function requireAnyAdmin() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Get the buildingId from any session type. Returns null for system_admin with no building context. */
export function sessionBuildingId(session: NonNullable<SessionData>): string | null {
  if (session.type === "unit") return session.buildingId;
  return session.buildingId;
}

export async function createUnitSession(unitId: string, buildingId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: { unitId, buildingId, token, expiresAt },
  });

  return token;
}

export async function createAdminSession(adminId: string, buildingId: string | null): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: { adminId, buildingId, token, expiresAt },
  });

  return token;
}

export function setSessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  };
}
