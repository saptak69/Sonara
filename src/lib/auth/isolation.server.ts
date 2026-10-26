import { getRequest } from "@tanstack/react-start/server";

/**
 * Reject scripted requests coming from another site.
 *
 * The session cookie is SameSite=Lax, which still lets a page on another site
 * submit forms or fire fetches at us in some cases. Browsers label every
 * request with Sec-Fetch-Site, so we only allow:
 *   - our own pages (same-origin)
 *   - requests with no browser context (SSR, server-to-server, native HTTP)
 *   - address-bar / bookmark loads (none) and top-level GET navigations
 */
export class CrossSiteRequestError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden: cross-site request blocked");
    this.name = "CrossSiteRequestError";
  }
}

export function assertSameSiteRequest(): void {
  const request = getRequest();
  if (!request) return;

  const headers = request.headers;
  const site = headers.get("sec-fetch-site");
  if (!site || site === "same-origin" || site === "none") return;

  const dest = headers.get("sec-fetch-dest");
  const isTopLevelGet =
    headers.get("sec-fetch-mode") === "navigate" &&
    request.method === "GET" &&
    dest !== "object" &&
    dest !== "embed";
  if (isTopLevelGet) return;

  throw new CrossSiteRequestError();
}
