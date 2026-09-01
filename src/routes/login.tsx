import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, Mail, Music2, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to /studio
  if (!isPending && user && !user.isDevFallback) {
    void navigate({ to: "/studio" });
    return null;
  }

  // Handle Continue with Google (Real Google OAuth)
  const handleGoogleClick = async () => {
    setLoading(true);
    try {
      const res = await (authClient.signIn as any).social?.({
        provider: "google",
        callbackURL: `${window.location.origin}/studio`,
      });

      if (res?.error) {
        toast.error(res.error.message || "Failed to start Google sign in", {
          description:
            "To connect real Google accounts, set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in your environment, or sign in directly with your email below.",
          duration: 6000,
        });
      } else if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google OAuth failed";
      toast.error(msg, {
        description:
          "To connect real Google accounts, set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in your environment, or sign in directly with your email below.",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      toast.error("Please enter both your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.signIn.email({
        email: cleanEmail,
        password,
      });
      if (res.error) {
        toast.error(res.error.message || "Invalid email or password. Please try again.");
      } else {
        toast.success("Welcome back to Sonara!");
        void navigate({ to: "/studio" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      toast.error("Please enter your display name or artist name.");
      return;
    }
    if (!cleanEmail || !password) {
      toast.error("Please provide both an email and password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.signUp.email({
        name: cleanName,
        email: cleanEmail,
        password,
      });

      if (res.error) {
        toast.error(res.error.message || "Registration failed. Please try another email.");
      } else {
        toast.success(`Account created! Welcome to Sonara, ${cleanName}.`);
        void navigate({ to: "/studio" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Account creation failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-black/70 backdrop-blur-3xl border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-48 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-48 rounded-full bg-accent/25 blur-3xl" />

        {/* Header & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2">
            <Logo compact={false} />
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Music streaming & independent artist platform
          </p>
        </div>

        {/* Spotify / YouTube Music Style: Continue with Google Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleClick}
          className="w-full h-12 rounded-full bg-white hover:bg-neutral-100 active:scale-[0.99] text-neutral-900 font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
        >
          <GoogleIcon className="size-5" />
          <span>Continue with Google</span>
        </button>

        {/* OR Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-white/15" />
          <span className="flex-shrink mx-3 text-[11px] text-muted uppercase tracking-widest font-semibold">
            or
          </span>
          <div className="flex-grow border-t border-white/15" />
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-2xl border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
              tab === "signin"
                ? "bg-white/15 text-fg shadow border border-white/20"
                : "text-muted hover:text-fg"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
              tab === "signup"
                ? "bg-white/15 text-fg shadow border border-white/20"
                : "text-muted hover:text-fg"
            }`}
          >
            Create Account
          </button>
        </div>

        {tab === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl bg-black/60 pr-4 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl bg-black/60 pr-10 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-fg transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-full bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-all active:scale-[0.99] shadow-lg shadow-accent/20"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setTab("signup")}
                className="text-xs text-muted hover:text-accent transition-colors"
              >
                Don't have an account? <span className="font-semibold text-fg underline">Create one now</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Your Name / Artist Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Saptak Mondal"
                  className="h-11 w-full rounded-xl bg-black/60 pr-4 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl bg-black/60 pr-4 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl bg-black/60 pr-10 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-fg transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-full bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-all active:scale-[0.99] shadow-lg shadow-accent/20"
            >
              {loading ? "Creating account..." : "Create Free Account"}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setTab("signin")}
                className="text-xs text-muted hover:text-accent transition-colors"
              >
                Already have an account? <span className="font-semibold text-fg underline">Sign In</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-muted flex items-center justify-center gap-1.5">
            <Music2 className="size-3.5 text-accent" />
            Instant access to Sonara Artist Studio & track publishing
          </p>
        </div>
      </div>
    </div>
  );
}



