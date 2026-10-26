import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./server";

/**
 * Resolve who is calling, from the request's session cookie or (in the Android
 * app) a bearer token. Never trust a user id sent by the client — only this.
 */

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type VerifiedUser = { id: string; email: string | null; name: string | null };

export async function getSessionUser(bearerToken?: string): Promise<VerifiedUser | null> {
  const request = getRequest();
  if (!request) return null;

  let headers = request.headers;
  if (bearerToken && !headers.has("authorization")) {
    headers = new Headers(headers);
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  const session = await auth.api.getSession({ headers });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

export async function requireUserId(bearerToken?: string): Promise<string> {
  const user = await getSessionUser(bearerToken);
  if (!user) throw new UnauthorizedError();
  return user.id;
}
