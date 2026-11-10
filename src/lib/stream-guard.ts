/**
 * Access rules for the audio proxy (/api/stream).
 *
 * The proxy exists so Sonara's own player can play sources that block
 * cross-origin playback. These rules keep other websites and scripts from using
 * it as a free bandwidth relay.
 */

export type GuardResult = { ok: true } | { ok: false; status: number; reason: string };

/** Only requests made by Sonara's own pages are served. */
export function checkRequestOrigin(requestUrl: string, headers: Headers): GuardResult {
  const site = headers.get("sec-fetch-site");
  if (site === "cross-site") {
    return { ok: false, status: 403, reason: "Cross-site use of the audio proxy isn't allowed" };
  }

  const origin = headers.get("origin");
  if (origin && origin !== "null") {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return { ok: false, status: 403, reason: "Bad origin" };
    }
    if (originHost !== new URL(requestUrl).host) {
      return { ok: false, status: 403, reason: "Cross-site use of the audio proxy isn't allowed" };
    }
  }
  return { ok: true };
}

/**
 * A fixed-window limiter kept in memory. On serverless hosting each instance has
 * its own counts, so this caps bursts rather than enforcing an exact quota.
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const windows = new Map<string, { start: number; count: number }>();

  return function hit(key: string, now = Date.now()): boolean {
    const current = windows.get(key);
    if (!current || now - current.start >= windowMs) {
      if (windows.size >= maxKeys) {
        for (const [k, w] of windows) {
          if (now - w.start >= windowMs) windows.delete(k);
        }
        if (windows.size >= maxKeys) windows.delete(windows.keys().next().value as string);
      }
      windows.set(key, { start: now, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  };
}

export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] || headers.get("x-real-ip") || "unknown").trim();
}
