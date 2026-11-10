import { createFileRoute } from "@tanstack/react-router";
import { clientKey, createRateLimiter } from "../../lib/stream-guard.ts";

const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

/**
 * Status of every music source as seen from this server (open /api/providers on the live
 * site to see what Vercel can reach). Cached for a minute and rate limited, because each
 * check calls the providers.
 */
export const Route = createFileRoute("/api/providers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!allow(clientKey(request.headers))) {
          return new Response("Too many requests", { status: 429, headers: { "Retry-After": "60" } });
        }
        const [{ probeProviders }, { serverCache }] = await Promise.all([
          import("../../lib/music/catalog"),
          import("../../lib/cache.server"),
        ]);
        const report = await serverCache.getOrFetch("providers:status", 60, probeProviders);
        return new Response(JSON.stringify(report, null, 2), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
