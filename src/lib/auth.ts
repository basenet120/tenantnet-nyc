import { cookies } from "next/headers";
import { prisma } from "./db";
import { COOKIE_NAME, SESSION_DURATION_DAYS } from "./constants";
import { randomBytes } from "crypto";

export type SessionData =
  | { type: "unit"; unitId: string; unitLabel: string; isRegistered: boolean }
  | { type: "admin"; adminId: string; email: string }
  | null;

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { unit: true, admin: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  if (session.unit) {
    return { type: "unit", unitId: session.unit.id, unitLabel: session.unit.label, isRegistered: session.unit.isRegistered };
  }
  if (session.admin) {
    return { type: "admin", adminId: session.admin.id, email: session.admin.email };
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

export async function createUnitSession(unitId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: { unitId, token, expiresAt },
  });

  return token;
}

export async function createAdminSession(adminId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: { adminId, token, expiresAt },
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
