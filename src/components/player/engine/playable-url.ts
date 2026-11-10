import type { Track } from "../../../lib/types";

const DIRECT_HOSTS = [
  "saavncdn.com",
  "sndcdn.com",
  "archive.org",
  ".blob.vercel-storage.com",
  "pixabay.com",
];

/**
 * The URL the <audio> element should load for a track. Hosts that allow cross-origin
 * playback and byte ranges play directly (instant seeking, no server load); everything
 * else goes through Sonara's own /api/stream proxy.
 */
export function resolvePlayableUrl(track?: Pick<Track, "streamUrl" | "kind"> | null): string {
  if (!track?.streamUrl) return "";
  const url = track.streamUrl;
  if (track.kind === "radio" || url.includes(".m3u8") || url.includes("/listen")) return url;
  if (url.startsWith("/api/stream") || url.startsWith("blob:") || url.startsWith("data:")) return url;

  if (url.startsWith("https://api.audius.co/") || DIRECT_HOSTS.some((host) => url.includes(host))) {
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/stream?url=${encodeURIComponent(url)}`;
  }
  return url;
}
