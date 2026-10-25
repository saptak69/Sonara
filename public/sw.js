/**
 * Sonara Offline PWA Service Worker
 * Caches application shell (HTML, CSS, JS, fonts) for seamless offline boot.
 * Allows access to downloaded offline songs without requiring an active internet connection.
 */

const SHELL_CACHE_NAME = "sonara-app-shell-v2";

// Core static assets to precache immediately on install
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/error.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SW] Precache failed, will cache on fetch:", err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            // NEVER delete the user's downloaded audio cache!
            if (key !== SHELL_CACHE_NAME && key !== "sonara-offline-audio-v1") {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Ignore non-GET requests
  if (request.method !== "GET") return;

  // 2. Ignore audio streaming endpoints and external CDNs (handled by offline-cache.ts)
  if (
    url.pathname.startsWith("/api/stream") ||
    url.pathname.startsWith("/offline/audio") ||
    url.hostname.includes("saavncdn.com") ||
    url.hostname.includes("sndcdn.com") ||
    url.hostname.includes("archive.org")
  ) {
    return;
  }

  // 3. Ignore Better Auth endpoints
  if (url.pathname.startsWith("/api/auth")) {
    return;
  }

  // 4. HTML document navigation: Network-First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Attempt network fetch with 3.5s timeout for flaky mobile connections
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const networkResponse = await fetch(request, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(SHELL_CACHE_NAME);
            // Cache both the exact route and the root fallback
            cache.put(request, networkResponse.clone()).catch(() => {});
            cache.put("/", networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
        } catch {
          // Offline or timeout, proceed to cache fallback
        }

        // Offline Fallback: Serve cached HTML for this route, or root "/" shell, or "/error.html"
        const cache = await caches.open(SHELL_CACHE_NAME);
        const cachedDoc =
          (await cache.match(request)) ||
          (await cache.match("/")) ||
          (await cache.match("/error.html"));

        if (cachedDoc) {
          return cachedDoc;
        }

        // Last resort: minimal offline response
        return new Response(
          "<!DOCTYPE html><html><head><meta http-equiv='refresh' content='2;url=/error.html'></head><body>Loading Sonara Offline...</body></html>",
          { headers: { "Content-Type": "text/html" } }
        );
      })()
    );
    return;
  }

  // 5. Static assets (JS, CSS, images, fonts): Stale-While-Revalidate
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".ico") ||
      url.pathname.endsWith(".woff2") ||
      url.pathname.endsWith(".webmanifest"));

  if (isStaticAsset) {
    event.respondWith(
      caches.open(SHELL_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(request).then((response) => response || fetch(request))
  );
});
