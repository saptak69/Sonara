import { createFileRoute } from "@tanstack/react-router";
import { fetchPublic } from "../../lib/safe-url.server.ts";

/**
 * Audio proxy for sources that block cross-origin playback or don't support
 * range requests. Supports HTTP 206 so seeking works, only reaches public
 * hosts, and only passes audio through (it is not a general web proxy).
 */

const AUDIO_TYPES = /^(audio\/|video\/mp4|application\/(ogg|octet-stream)|binary\/octet-stream)/i;
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
        if (targetUrl.length > 4000) {
          return new Response("URL too long", { status: 414 });
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
          let upstream = await fetchPublic(targetUrl, {
            headers: upstreamHeaders,
            signal: abortController.signal,
          });

          // Resilient audio quality fallback: If JioSaavn CDN returns 404 for 320kbps, cascade down to available bitrates
          if (upstream.status === 404 && targetUrl.includes("saavncdn.com")) {
            const fallbackBitrates = ["_160.mp4", "_96.mp4", "_48.mp4", "_12.mp4"];
            for (const br of fallbackBitrates) {
              const fallbackUrl: string = targetUrl.replace(/_(?:320|160|96|48|12)\.(mp4|m4a)/, br);
              if (fallbackUrl === targetUrl) continue;
              const retry = await fetchPublic(fallbackUrl, {
                headers: upstreamHeaders,
                signal: abortController.signal,
              });
              if (retry.ok || retry.status === 206) {
                upstream = retry;
                break;
              }
            }
          }

          if (!upstream.ok && upstream.status !== 206) {
            return new Response(`Upstream error: ${upstream.statusText}`, {
              status: upstream.status,
            });
          }

          const upstreamType = upstream.headers.get("content-type") ?? "";
          if (upstreamType && !AUDIO_TYPES.test(upstreamType)) {
            void upstream.body?.cancel();
            return new Response("Not an audio stream", { status: 415 });
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
        } catch (err) {
          if ((err instanceof Error && err.name === "AbortError") || request.signal.aborted) {
            return new Response(null, { status: 499 });
          }
          const message = err instanceof Error ? err.message : String(err);
          const blocked = /not allowed/i.test(message);
          return new Response(blocked ? "Source not allowed" : "Couldn't reach the audio source", {
            status: blocked ? 403 : 502,
          });
        }
      },
    },
  },
});
