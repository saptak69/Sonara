import { useMemo } from "react";
import { authClient } from "./client";

export type AppUser = {
  id: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  memberSince: Date | null;
};

export type CurrentUserState = {
  /** null while loading AND when signed out — check isPending before redirecting. */
  user: AppUser | null;
  isPending: boolean;
  /** The session couldn't be checked (usually offline). Don't treat as signed out. */
  isUnknown: boolean;
};

/**
 *   const { user, isPending } = useCurrentUserState();
 *   if (isPending) return <Spinner />;
 *   if (!user) return <Navigate to="/login" />;
 */
export function useCurrentUserState(): CurrentUserState {
  const session = authClient.useSession();
  const raw = session.data?.user;

  const user = useMemo<AppUser | null>(() => {
    if (!raw) return null;
    return {
      id: raw.id,
      displayName: raw.name || null,
      email: raw.email ?? null,
      avatarUrl: raw.image ?? null,
      memberSince: raw.createdAt ? new Date(raw.createdAt) : null,
    };
  }, [raw]);

  return { user, isPending: session.isPending, isUnknown: !raw && Boolean(session.error) };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}

/** First name, or the part of the email before the @, for friendly greetings. */
export function firstName(user: AppUser | null): string {
  if (!user) return "";
  const name = user.displayName?.trim();
  if (name) return name.split(/\s+/)[0] ?? name;
  return user.email?.split("@")[0] ?? "";
}
