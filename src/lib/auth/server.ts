/**
 * Better Auth, server side. Mounted at /api/auth/* (see routes/api/auth/$.ts).
 *
 * Sign-in methods:
 *   - Google on the web (OAuth redirect)
 *   - Google on Android (native account picker → ID token → /one-tap/callback)
 *   - Email + password
 *
 * Sessions live in Postgres (Neon) when DATABASE_URL is set, otherwise in the
 * embedded PGLite database used for local development.
 *
 * Server-only: never import this from a component.
 */
import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { bearer, oneTap } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, PRODUCTION_URL } from "./config";
import { pgliteDialect } from "./pglite-dialect";

void ensureDbReady();

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

const isProduction = process.env.NODE_ENV === "production";

// In development we tolerate a missing secret by minting one per process. It is
// pinned to globalThis so a hot reload doesn't log everybody out.
function devSecret(): string {
  const g = globalThis as typeof globalThis & { __sonaraDevAuthSecret?: string };
  const value = g.__sonaraDevAuthSecret ?? randomBytes(32).toString("hex");
  g.__sonaraDevAuthSecret = value;
  return value;
}

const secret = env("BETTER_AUTH_SECRET");
if (!secret && isProduction) {
  console.error("[auth] BETTER_AUTH_SECRET is not set — sessions will not survive a restart.");
}

const vercelHost = env("VERCEL_PROJECT_PRODUCTION_URL") ?? env("VERCEL_URL");
const explicitBaseURL = env("BETTER_AUTH_URL") ?? (vercelHost ? `https://${vercelHost}` : undefined);
const productionHost = new URL(PRODUCTION_URL).host;

// Without an explicit URL (local dev), let Better Auth derive the origin from
// the request, but only for hosts we recognise.
const baseURL = explicitBaseURL ?? {
  allowedHosts: ["localhost:8080", "127.0.0.1:8080", "[::1]:8080", "localhost", productionHost],
  protocol: "auto" as const,
  fallback: PRODUCTION_URL,
};

const trustedOrigins = [
  ...(explicitBaseURL ? [explicitBaseURL] : []),
  PRODUCTION_URL,
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
  // Capacitor shells
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
];

const databaseUrl = env("DATABASE_URL");
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

const googleClientId = env("GOOGLE_CLIENT_ID") ?? GOOGLE_WEB_CLIENT_ID;
const googleClientSecret = env("GOOGLE_CLIENT_SECRET");
if (!googleClientSecret) {
  console.warn("[auth] GOOGLE_CLIENT_SECRET is not set — web Google sign-in will fail; Android sign-in still works.");
}

/**
 * Cookie names are kept from the first version of the app. Renaming them would
 * silently sign out every existing user.
 */
export const SESSION_COOKIE_PREFIX = "__Host-grok-auth";

export const auth = betterAuth({
  baseURL,
  secret: secret ?? devSecret(),
  database,
  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    // Early accounts were allowed 6 characters; new sign-ups are asked for 8 in the UI.
    minPasswordLength: 6,
    autoSignIn: true,
  },

  socialProviders: {
    google: {
      clientId: googleClientId,
      // Only the redirect flow needs the secret; ID-token verification doesn't.
      clientSecret: googleClientSecret ?? "",
      prompt: "select_account",
    },
  },

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      // Signing in with Google using the same email as an existing email/password
      // account merges them instead of creating a second profile. "grok-google"
      // is the provider id early accounts were created under.
      trustedProviders: ["google", "grok-google"],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // refresh the expiry at most once a day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },

  advanced: {
    // `__Host-` cookies can't be scoped to a parent domain, so no other site
    // under the same domain can plant or read them.
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: `${SESSION_COOKIE_PREFIX}.session_token` },
      session_data: { name: `${SESSION_COOKIE_PREFIX}.session_data` },
      account_data: { name: `${SESSION_COOKIE_PREFIX}.account_data` },
      dont_remember: { name: `${SESSION_COOKIE_PREFIX}.dont_remember` },
    },
  },

  plugins: [
    // The Android app gets an ID token from the native account picker; the web
    // client ID is the audience it is issued for.
    oneTap({ clientId: [googleClientId, GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID] as unknown as string }),
    // Android WebView cookies are occasionally dropped after the app is killed,
    // so the native shell also keeps a bearer copy of the session token.
    bearer(),
    // Must stay last: copies Better Auth's Set-Cookie headers onto Start responses.
    tanstackStartCookies(),
  ],
});
