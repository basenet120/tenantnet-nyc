import type { SessionData } from "./auth";

/**
 * Returns a Prisma `where` clause for post visibility filtering.
 * Admins see all posts. Unit users see public posts + their own private posts.
 */
export function postVisibilityWhere(session: NonNullable<SessionData>) {
  if (session.type === "admin") {
    // All admin roles see everything (including mgmt_rep)
    return {};
  }
  // Unit users: see public posts + their own private posts
  return {
    OR: [
      { visibility: "public" as const },
      { unitId: session.unitId },
    ],
  };
}
