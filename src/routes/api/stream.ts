import { createFileRoute } from "@tanstack/react-router";

/**
 * Resilient Audio Stream Proxy supporting HTTP 206 Partial Content range requests.
 * Allows browsers to seek and scrub seamlessly across any audio source without
 * encountering CDN range-rejections or CORS blocking.
 *
 * Hardened against client socket aborts, ECONNRESET, and stream premature closes
 * so seeking and track-skipping NEVER crash the Node.js server.
 */
export const Route = createFileRoute("/api/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        const targetUrl = reqUrl.searchParams.get("url");

        if (!targetUrl) {
          return new Response("Missing audio url parameter", { status: 400 });
        }

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(targetUrl);
        } catch {
          return new Response("Invalid audio url", { status: 400 });
        }

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          return new Response("Invalid protocol", { status: 400 });
        }

        const rangeHeader = request.headers.get("range");

        const upstreamHeaders: Record<string, string> = {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "*/*",
        };

        if (rangeHeader) {
          upstreamHeaders["Range"] = rangeHeader;
        }

        const abortController = new AbortController();
        if (request.signal.aborted) {
          abortController.abort();
        } else {
          request.signal.addEventListener("abort", () => {
            abortController.abort();
          });
        }

        try {
          let upstream = await fetch(targetUrl, {
            headers: upstreamHeaders,
            redirect: "follow",
            signal: abortController.signal,
          });

          // Resilient audio quality fallback: If JioSaavn 320kbps returns 404, fallback to 160kbps
          if (upstream.status === 404 && targetUrl.includes("saavncdn.com") && targetUrl.includes("_320.mp4")) {
            const fallback160 = targetUrl.replace("_320.mp4", "_160.mp4");
            const retry = await fetch(fallback160, {
              headers: upstreamHeaders,
              redirect: "follow",
              signal: abortController.signal,
            });
            if (retry.ok || retry.status === 206) {
              upstream = retry;
            }
          }

          if (!upstream.ok && upstream.status !== 206) {
            return new Response(`Upstream error: ${upstream.statusText}`, {
              status: upstream.status,
            });
          }

          const responseHeaders = new Headers();
          responseHeaders.set("Accept-Ranges", "bytes");
          responseHeaders.set("Access-Control-Allow-Origin", "*");
          responseHeaders.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
          responseHeaders.set(
            "Access-Control-Expose-Headers",
            "Content-Range, Content-Length, Accept-Ranges",
          );
          responseHeaders.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

          const contentType = upstream.headers.get("content-type") || "audio/mp4";
          responseHeaders.set("Content-Type", contentType);

          if (!upstream.body) {
            return new Response(null, {
              status: upstream.status,
              headers: responseHeaders,
            });
          }

          const transform = new TransformStream();

          // Upstream already returned HTTP 206 Partial Content
          if (upstream.status === 206) {
            const contentRange = upstream.headers.get("content-range");
            const contentLength = upstream.headers.get("content-length");
            if (contentRange) responseHeaders.set("Content-Range", contentRange);
            if (contentLength) responseHeaders.set("Content-Length", contentLength);

            upstream.body
              .pipeTo(transform.writable, { signal: abortController.signal })
              .catch(() => {});

            return new Response(transform.readable, {
              status: 206,
              headers: responseHeaders,
            });
          }

          // Upstream returned 200, but client requested a Range
          if (rangeHeader && rangeHeader.startsWith("bytes=")) {
            const totalLengthStr = upstream.headers.get("content-length");
            const rangeSpec = rangeHeader.replace("bytes=", "").trim();
            const [startStr, endStr] = rangeSpec.split("-");

            if (totalLengthStr) {
              const totalLength = parseInt(totalLengthStr, 10);
              const start = parseInt(startStr, 10) || 0;
              const end = endStr ? parseInt(endStr, 10) : totalLength - 1;

              if (start >= totalLength) {
                return new Response("Requested range not satisfiable", {
                  status: 416,
                  headers: {
                    "Content-Range": `bytes */${totalLength}`,
                    "Access-Control-Allow-Origin": "*",
                  },
                });
              }

              responseHeaders.set("Content-Range", `bytes ${start}-${end}/${totalLength}`);
              responseHeaders.set("Content-Length", String(end - start + 1));

              // Byte-level range slicing transform stream
              let bytesSeen = 0;
              const sliceTransform = new TransformStream<Uint8Array, Uint8Array>({
                transform(chunk, controller) {
                  const chunkStart = bytesSeen;
                  const chunkEnd = bytesSeen + chunk.byteLength - 1;
                  bytesSeen += chunk.byteLength;

                  if (chunkEnd < start || chunkStart > end) {
                    return;
                  }
                  const sliceStart = Math.max(0, start - chunkStart);
                  const sliceEnd = Math.min(chunk.byteLength, end - chunkStart + 1);
                  controller.enqueue(chunk.subarray(sliceStart, sliceEnd));

                  if (bytesSeen > end) {
                    controller.terminate();
                  }
                },
              });

              upstream.body
                .pipeThrough(sliceTransform, { signal: abortController.signal })
                .pipeTo(transform.writable, { signal: abortController.signal })
                .catch(() => {});

              return new Response(transform.readable, {
                status: 206,
                headers: responseHeaders,
              });
            }
          }

          // Otherwise pipe normally
          upstream.body
            .pipeTo(transform.writable, { signal: abortController.signal })
            .catch(() => {});

          // Standard 200 response
          const len = upstream.headers.get("content-length");
          if (len) responseHeaders.set("Content-Length", len);

          return new Response(transform.readable, {
            status: 200,
            headers: responseHeaders,
          });
        } catch (err: any) {
          if (err.name === "AbortError" || request.signal.aborted) {
            return new Response(null, { status: 499 });
          }
          return new Response(`Stream fetch failed: ${err?.message || err}`, {
            status: 502,
          });
        }
      },
    },
  },
});
