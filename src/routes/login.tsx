import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import {
  SignInCancelled,
  isNativeApp,
  promptGoogleOneTap,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

type LoginSearch = { redirect?: string; mode?: "signin" | "signup"; error?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    // Only allow in-app paths, never an absolute URL to another site.
    redirect: typeof search.redirect === "string" && search.redirect.startsWith("/") && !search.redirect.startsWith("//")
      ? search.redirect
      : undefined,
    mode: search.mode === "signup" ? "signup" : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in · Sonara" }] }),
  component: LoginPage,
});

function GoogleMark() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function LoginPage() {
  const { redirect = "/", mode: initialMode = "signin", error } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [formError, setFormError] = useState<string | null>(
    error === "google" ? "Google sign-in didn't finish. Try again, or use your email." : null,
  );

  // Already signed in (or just finished signing in): go where they were headed.
  useEffect(() => {
    if (!isPending && user) void navigate({ href: redirect, replace: true });
  }, [isPending, user, navigate, redirect]);

  useEffect(() => promptGoogleOneTap(redirect), [redirect]);

  const onGoogle = async () => {
    setBusy("google");
    setFormError(null);
    try {
      await signInWithGoogle(redirect);
      // On Android the session is ready now: stop the spinner and leave the page.
      // (On the web the browser is already being redirected to Google.)
      if (isNativeApp()) {
        setBusy(null);
        void navigate({ href: redirect, replace: true });
      }
    } catch (err) {
      if (!(err instanceof SignInCancelled)) {
        setFormError(err instanceof Error ? err.message : "Google sign-in failed.");
      }
      setBusy(null);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (mode === "signup" && password.length < 8) {
      setFormError("Use at least 8 characters for your password.");
      return;
    }

    setBusy("email");
    try {
      if (mode === "signup") {
        await signUpWithEmail(name, email, password);
        toast.success(`Welcome to Sonara${name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}!`);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setFormError(null);
  };

  return (
    <div className="grid min-h-[calc(100dvh-8rem)] place-items-center px-4 py-10 short:min-h-[calc(100dvh-2rem)] short:py-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center short:mb-4">
          <Logo className="mb-5 short:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "signin"
              ? "Your playlists, likes and history follow you to every device."
              : "Free forever. Save music, build playlists, pick up where you left off anywhere."}
          </p>
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy !== null}
          data-tv-autofocus
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100 active:scale-[0.99] disabled:opacity-60"
        >
          {busy === "google" ? <Loader2 className="size-5 animate-spin" /> : <GoogleMark />}
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[11px] font-medium tracking-[0.14em] text-subtle uppercase">
          <span className="h-px flex-1 bg-border" />
          or with email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
          {mode === "signup" && (
            <Field label="Name">
              <input
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className={inputClass}
              />
            </Field>
          )}

          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                className={cn(inputClass, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-subtle transition hover:text-fg"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          {formError && (
            <p role="alert" className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={busy !== null || !email || !password || (mode === "signup" && !name.trim())}
            className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-fg transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-50"
          >
            {busy === "email" && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "signin" ? "New to Sonara?" : "Already have an account?"}{" "}
          <button type="button" onClick={switchMode} className="font-semibold text-fg underline-offset-4 hover:underline">
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>

        <p className="mt-8 text-center text-xs leading-relaxed text-subtle">
          By continuing you agree to the{" "}
          <Link to="/terms" className="underline underline-offset-2 hover:text-muted">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-muted">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-fg outline-none transition placeholder:text-subtle focus:border-accent/60 focus:ring-2 focus:ring-accent/20";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
