import { createMiddleware } from "@tanstack/react-start";

/**
 * Attach to every server function that reads or writes a user's data:
 *
 *   createServerFn().middleware([authMiddleware]).handler(({ context }) => context.userId)
 *
 * Signed-out callers get a 401. Queries must always be scoped by context.userId.
 */
export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    // The Android app keeps a bearer copy of the session (see client.ts).
    const { getSessionToken } = await import("./client");
    return next({ sendContext: { bearerToken: getSessionToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    // Keep these as *.server imports so they never end up in the browser bundle.
    const { assertSameSiteRequest } = await import("./isolation.server");
    const { requireUserId } = await import("./verify.server");
    assertSameSiteRequest();
    const userId = await requireUserId(context.bearerToken);
    return next({ context: { userId } });
  });

/**
 * Same as authMiddleware, but lets signed-out callers through with userId null.
 * Useful for endpoints that work for guests and personalise for members.
 */
export const optionalAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getSessionToken } = await import("./client");
    return next({ sendContext: { bearerToken: getSessionToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { getSessionUser } = await import("./verify.server");
    let userId: string | null = null;
    try {
      userId = (await getSessionUser(context.bearerToken))?.id ?? null;
    } catch {
      userId = null;
    }
    return next({ context: { userId } });
  });
