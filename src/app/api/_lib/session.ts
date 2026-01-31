import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { type User } from "@shared/schema";
import crypto from "crypto";

export type SessionData = {
  user?: User;
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();

  // Ensure SESSION_SECRET is present. For local development, use a dev fallback
  // to avoid crashing the dev server, but warn the developer.
  let password = process.env.SESSION_SECRET;
  if (!password && process.env.NODE_ENV === "development") {
    // Generate a secure random secret for local dev that satisfies iron-session length.
    password = crypto.randomBytes(48).toString("hex");
    // eslint-disable-next-line no-console
    console.warn("SESSION_SECRET not set — using secure development fallback. Set SESSION_SECRET in env for production.");
  }
  if (!password) {
    throw new Error("Missing SESSION_SECRET environment variable. Set SESSION_SECRET to a strong secret.");
  }

  const session = await getIronSession<SessionData>(cookieStore, {
    password,
    cookieName: "clothinv.sid",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    },
  });
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.user) {
    return { ok: false as const };
  }
  return { ok: true as const, user: session.user, session };
}

/** Require super_admin role (platform governance). */
export async function requireSuperAdmin() {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false as const };
  if (auth.user.role !== "super_admin") {
    return { ok: false as const, forbidden: true as const };
  }
  return { ok: true as const, user: auth.user, session: auth.session };
}

/** Require admin or super_admin (merchant/store management). */
export async function requireAdmin() {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false as const };
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") {
    return { ok: false as const, forbidden: true as const };
  }
  return { ok: true as const, user: auth.user, session: auth.session };
}

/** Require one of the given roles. */
export async function requireRole(roles: string[]) {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false as const };
  if (!roles.includes(auth.user.role)) {
    return { ok: false as const, forbidden: true as const };
  }
  return { ok: true as const, user: auth.user, session: auth.session };
}


