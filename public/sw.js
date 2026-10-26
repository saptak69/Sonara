/**
 * Sonara Offline PWA Service Worker
 * Caches application shell (HTML, CSS, JS, fonts) for seamless offline boot.
 * Allows access to downloaded offline songs without requiring an active internet connection.
 */

const SHELL_CACHE_NAME = "sonara-app-shell-v4";

// Core static assets to precache immediately on install
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/brand/mark.webp",
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

  // 4. HTML document navigation: network first.
  //    - Slow network: after 3.5s show this exact page from cache if we have it,
  //      otherwise keep waiting for the network (never show a different page).
  //    - Offline: this page from cache, then the home shell, then the offline player.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE_NAME);

        const network = fetch(request).then((response) => {
          if (response && response.ok) {
            // Keep each page under its own URL, so "/" always holds the home page.
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        });

        try {
          const cachedPage = await cache.match(request);
          if (!cachedPage) return await network;

          const slow = new Promise((resolve) => setTimeout(() => resolve(cachedPage), 3500));
          return await Promise.race([network, slow]);
        } catch {
          // Offline (or the request failed outright).
          return (
            (await cache.match(request)) ||
            (await cache.match("/")) ||
            (await cache.match("/error.html")) ||
            new Response(
              "<!DOCTYPE html><html><head><meta http-equiv='refresh' content='2;url=/error.html'></head><body>Loading Sonara Offline...</body></html>",
              { headers: { "Content-Type": "text/html" } },
            )
          );
        }
      })(),
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
