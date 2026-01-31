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
  // to avoid crashing the dev server, but warn the developer. Also support a
  // configurable session lifetime via SESSION_MAX_AGE (seconds).
  // Support a legacy lowercase `session_secret` as a harmless fallback so
  // accidental duplicates don't cause surprising behavior.
  let password = process.env.SESSION_SECRET ?? process.env.session_secret;
  let passwordEnvName = process.env.SESSION_SECRET
    ? "SESSION_SECRET"
    : process.env.session_secret
    ? "session_secret"
    : undefined;
  const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE) || 60 * 60 * 24 * 20; // 20 days in seconds

  if (!password && process.env.NODE_ENV === "development") {
    // Generate a secure random secret for local dev that satisfies iron-session length.
    password = crypto.randomBytes(48).toString("hex");
    passwordEnvName = "generated_dev_fallback";
    // eslint-disable-next-line no-console
    console.warn("SESSION_SECRET not set — using secure development fallback. Set SESSION_SECRET in env for production.");
  }
  if (!password) {
    throw new Error("Missing SESSION_SECRET environment variable. Set SESSION_SECRET to a strong secret.");
  }

  // Log which env var we're using (do not print the secret itself) and detect
  // accidental duplicate lowercase key usage.
  // eslint-disable-next-line no-console
  console.info(`Using ${passwordEnvName ?? "SESSION_SECRET"} for session (secret length: ${password.length}).`);
  if (process.env.SESSION_SECRET && process.env.session_secret && process.env.SESSION_SECRET !== process.env.session_secret) {
    // eslint-disable-next-line no-console
    console.warn("Both SESSION_SECRET and session_secret are defined and differ; remove the lowercase `session_secret` to avoid confusion.");
  }

  // iron-session requires a password of at least 32 characters. Provide a
  // clear error message when a too-short SESSION_SECRET is present.
  if (password.length < 32) {
    // eslint-disable-next-line no-console
    console.error(`${passwordEnvName ?? "SESSION_SECRET"} must be at least 32 characters long. Update .env.local and restart the server.`);
    throw new Error(`${passwordEnvName ?? "SESSION_SECRET"} must be at least 32 characters long. Update .env.local and restart the server.`);
  }

  const session = await getIronSession<SessionData>(cookieStore, {
    password,
    cookieName: "clothinv.sid",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      path: "/",
      maxAge: SESSION_MAX_AGE,
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


