import { oneTapClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { Capacitor } from "@capacitor/core";
import { GOOGLE_WEB_CLIENT_ID } from "./config";

/**
 * Browser-side auth. Components should use the helpers below (signInWithGoogle,
 * signInWithEmail, signUpWithEmail, signOut) rather than calling authClient
 * directly, so the Android token handling stays in one place.
 */

// ── Session token (Android app) ───────────────────────────────────────────────
// The key name predates this file; keeping it means existing app users stay
// signed in after the update.
const TOKEN_KEY = "grok-auth.bearer-token";

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setSessionToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    // Older builds also kept a copy here.
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked — the cookie still works */
  }
}

export const authClient = createAuthClient({
  plugins: [oneTapClient({ clientId: GOOGLE_WEB_CLIENT_ID, autoSelect: true, context: "signin" })],
  fetchOptions: {
    onRequest(ctx) {
      const token = getSessionToken();
      if (token) ctx.headers.set("Authorization", `Bearer ${token}`);
      return ctx;
    },
    onSuccess(ctx) {
      // The bearer plugin hands back a fresh token after every sign-in.
      const token = ctx.response.headers.get("set-auth-token");
      if (token && isNativeApp()) setSessionToken(token);
    },
  },
});

// ── Errors ────────────────────────────────────────────────────────────────────

export class SignInCancelled extends Error {
  constructor() {
    super("Sign-in cancelled");
    this.name = "SignInCancelled";
  }
}

const FRIENDLY_ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match. Try again or reset it.",
  USER_ALREADY_EXISTS: "There's already an account with this email. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "There's already an account with this email. Sign in instead.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  INVALID_EMAIL: "That doesn't look like a valid email address.",
  TOO_MANY_REQUESTS: "Too many attempts. Wait a minute and try again.",
};

function friendly(error: { code?: string; message?: string; status?: number } | null | undefined, fallback: string) {
  if (!error) return fallback;
  if (error.status === 429) return FRIENDLY_ERRORS.TOO_MANY_REQUESTS;
  return (error.code && FRIENDLY_ERRORS[error.code]) || error.message || fallback;
}

// ── Sign-in methods ───────────────────────────────────────────────────────────

/**
 * Google sign-in. On Android this opens the system account picker and trades
 * the resulting ID token for a session; on the web it redirects to Google.
 * Resolves once signed in (Android) or once the redirect has started (web).
 */
export async function signInWithGoogle(returnTo = "/"): Promise<void> {
  if (isNativeApp()) {
    await nativeGoogleSignIn();
    return;
  }

  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: returnTo,
    errorCallbackURL: `/login?error=google&redirect=${encodeURIComponent(returnTo)}`,
  });
  if (error) throw new Error(friendly(error, "Couldn't reach Google. Try again."));
  if (data?.url) window.location.href = data.url;
}

async function nativeGoogleSignIn() {
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID, mode: "online" } });

  let idToken: string | undefined;
  try {
    const response = await SocialLogin.login({ provider: "google", options: { style: "bottom" } });
    const result = response.result as { idToken?: string | null } | undefined;
    idToken = result?.idToken ?? undefined;
  } catch (err) {
    const raw = err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
    const message = raw.toLowerCase();
    console.warn("[auth] native Google sign-in failed:", raw);
    // Only a real dismissal counts as "cancelled". Google's error 16 means the account
    // check failed (usually the app's signing key doesn't match its OAuth client), so say so.
    if (/cancel|12501|dismiss/.test(message)) throw new SignInCancelled();
    if (/reauth|\[16\]|\b16\b/.test(message)) {
      throw new Error("Google rejected this app build (error 16). Sign in with email, or check the app's signing key in Google Cloud.");
    }
    if (/no credential|no account|not available/.test(message)) {
      throw new Error("No Google account found on this device. Add one in Settings, or sign in with email.");
    }
    throw new Error(`Google sign-in failed: ${raw.replace(/^Google Sign-In failed:\s*/i, "").slice(0, 120)}`);
  }
  if (!idToken) throw new Error("Google didn't return an account. Try again.");

  const res = await fetch("/api/auth/one-tap/callback", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const body = (await res.json().catch(() => null)) as { token?: string; message?: string } | null;
  if (!res.ok) throw new Error(body?.message ?? "Google sign-in failed. Try again.");

  const token = res.headers.get("set-auth-token") ?? body?.token;
  if (token) setSessionToken(token);
  // The token exchange above bypasses authClient, so tell its session store to reload;
  // otherwise screens such as /login keep believing nobody is signed in.
  await authClient.getSession({ query: { disableCookieCache: true } });
  authClient.$store.notify("$sessionSignal");
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { data, error } = await authClient.signIn.email({ email: email.trim(), password });
  if (error) throw new Error(friendly(error, "Couldn't sign you in. Try again."));
  if (isNativeApp() && data?.token) setSessionToken(data.token);
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<void> {
  const { data, error } = await authClient.signUp.email({
    name: name.trim(),
    email: email.trim(),
    password,
  });
  if (error) throw new Error(friendly(error, "Couldn't create your account. Try again."));
  if (isNativeApp() && data?.token) setSessionToken(data.token);
}

/** Show Google One Tap on the web when the visitor is already signed in to Google. */
export function promptGoogleOneTap(returnTo = "/") {
  if (isNativeApp() || typeof window === "undefined") return;
  void authClient.oneTap({ callbackURL: returnTo }).catch(() => {
    /* One Tap is a nicety; the regular button still works */
  });
}

export async function updateProfile(changes: { name?: string; image?: string | null }) {
  const { error } = await authClient.updateUser(changes);
  if (error) throw new Error(friendly(error, "Couldn't save your profile."));
}

// ── Sign-out ──────────────────────────────────────────────────────────────────

const signOutListeners = new Set<() => void>();

/** Run something when the user signs out (e.g. wipe their cached library). */
export function onSignOut(listener: () => void): () => void {
  signOutListeners.add(listener);
  return () => signOutListeners.delete(listener);
}

/**
 * End the session on the server, then forget everything local. Throws if the
 * server can't be reached so the UI can offer a retry instead of pretending.
 */
export async function signOut(redirectTo = "/"): Promise<void> {
  const { error } = await authClient.signOut();
  if (error && error.status !== 401) {
    throw new Error(friendly(error, "Couldn't sign out. Check your connection and try again."));
  }
  setSessionToken(null);
  for (const listener of signOutListeners) listener();

  if (isNativeApp()) {
    void import("@capgo/capacitor-social-login")
      .then(({ SocialLogin }) => SocialLogin.logout({ provider: "google" }))
      .catch(() => {});
  }
  window.location.href = redirectTo;
}
