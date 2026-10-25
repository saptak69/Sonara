import { useState, useEffect, useCallback } from "react";
import type { Track } from "./types";

const CACHE_NAME = "sonara-offline-audio-v1";
const METADATA_KEY = "sonara_offline_metadata_v1";
const EVENT_NAME = "sonara:offline-updated";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function isOfflineSupported(): boolean {
  return isBrowser() && "caches" in window;
}

function getStoredMetadata(): Track[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredMetadata(tracks: Track[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(tracks));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // quota exceeded or private mode
  }
}

function getCacheKey(trackId: string): string {
  return `/offline/audio/${encodeURIComponent(trackId)}`;
}

/**
 * Checks if a track is downloaded (synchronous, backed by metadata storage).
 */
export function isTrackDownloaded(trackId: string): boolean {
  if (!isBrowser()) return false;
  const list = getStoredMetadata();
  return list.some((t) => t.id === trackId);
}

/**
 * Returns all downloaded tracks.
 */
export function getDownloadedTracks(): Track[] {
  return getStoredMetadata();
}

/**
 * Downloads audio stream to browser Cache API and saves track metadata.
 * Uses a resilient multi-tier download strategy:
 * 1. Resolves full streamUrl if track only has a 30s preview or missing streamUrl
 * 2. Tries direct CDN candidates (320, 160, 96 kbps)
 * 3. Falls back to streaming proxy (/api/stream) if direct fetch encounters CORS or CDN 404
 * 4. Caches both audio blob and artwork thumbnail in Cache API
 */
export async function downloadTrackAudio(
  track: Track,
  onProgress?: (pct: number) => void,
): Promise<boolean> {
  if (!isOfflineSupported() || !track?.id) return false;

  try {
    let resolvedTrack: Track = { ...track };

    // 1. If streamUrl is missing or is a short 30-second preview, dynamically resolve the full master stream
    const isPreview =
      !resolvedTrack.streamUrl ||
      resolvedTrack.streamUrl.includes("dzcdn.net") ||
      (resolvedTrack.duration != null && resolvedTrack.duration <= 35);

    if (isPreview && resolvedTrack.title) {
      try {
        const { resolveFullTrackStreamServerFn } = await import("./saavn-api");
        const full = await resolveFullTrackStreamServerFn({
          data: { title: resolvedTrack.title, artist: resolvedTrack.artist },
        });
        if (full?.streamUrl) {
          resolvedTrack = {
            ...resolvedTrack,
            streamUrl: full.streamUrl,
            duration: full.duration || resolvedTrack.duration,
          };
        }
      } catch (err) {
        console.warn("Could not resolve full track stream for download:", err);
      }
    }

    if (!resolvedTrack.streamUrl) {
      // Fallback: try fetchTrack if track has an id
      try {
        const { fetchTrack } = await import("./music-api");
        const fetched = await fetchTrack(resolvedTrack.id);
        if (fetched?.streamUrl) {
          resolvedTrack = { ...resolvedTrack, ...fetched };
        }
      } catch (err) {
        console.warn("fetchTrack failed for download:", err);
      }
    }

    if (!resolvedTrack.streamUrl) {
      console.error(`Cannot download track "${resolvedTrack.title}": no valid streamUrl`);
      return false;
    }

    onProgress?.(10);

    const cache = await caches.open(CACHE_NAME);
    const cacheKey = getCacheKey(resolvedTrack.id);

    // Multi-tier resilient fetch strategy
    const candidateUrls: string[] = [];
    const directUrl = resolvedTrack.streamUrl;
    candidateUrls.push(directUrl);

    if (directUrl.includes("saavncdn.com")) {
      if (directUrl.includes("_320.mp4")) {
        candidateUrls.push(directUrl.replace("_320.mp4", "_160.mp4"));
        candidateUrls.push(directUrl.replace("_320.mp4", "_96.mp4"));
      }
    }

    // Proxy URL (works across all origins, handles range and content-length)
    const proxyBase =
      typeof window !== "undefined" && window.location.origin.startsWith("http")
        ? window.location.origin
        : "https://sonara-murex.vercel.app";
    const proxyUrl = `${proxyBase}/api/stream?url=${encodeURIComponent(directUrl)}`;
    candidateUrls.push(proxyUrl);

    let res: Response | null = null;

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, {
          headers: { Accept: "*/*" },
          mode: "cors",
        });

        if (response.ok || response.status === 206) {
          res = response;
          break;
        }
      } catch {
        // Network or CORS failure on candidate, continue to next
      }
    }

    if (!res) {
      throw new Error(`All download candidates failed for track "${resolvedTrack.title}"`);
    }

    onProgress?.(50);

    const blob = await res.blob();
    if (!blob || blob.size < 500) {
      throw new Error(`Downloaded audio file is empty or corrupted (${blob?.size ?? 0} bytes)`);
    }

    onProgress?.(80);

    // Put into Cache API
    const storedResponse = new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "audio/mp4",
        "Content-Length": String(blob.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });

    await cache.put(cacheKey, storedResponse);

    // Cache artwork thumbnail for offline display
    const artUrl = resolvedTrack.artworkLg || resolvedTrack.artwork;
    if (artUrl) {
      try {
        const artRes = await fetch(artUrl, { mode: "no-cors" });
        if (artRes) {
          const artCacheKey = `/offline/artwork/${encodeURIComponent(resolvedTrack.id)}`;
          await cache.put(artCacheKey, artRes);
        }
      } catch {
        // Artwork caching is best-effort
      }
    }

    onProgress?.(95);

    // Update metadata list
    const existing = getStoredMetadata().filter((t) => t.id !== resolvedTrack.id);
    saveStoredMetadata([resolvedTrack, ...existing]);
    onProgress?.(100);

    return true;
  } catch (e) {
    console.error(`Failed to download audio for track ${track.id}:`, e);
    return false;
  }
}

/**
 * Removes downloaded audio from Cache API and updates metadata.
 */
export async function removeDownloadedAudio(trackId: string): Promise<boolean> {
  if (!isOfflineSupported()) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(getCacheKey(trackId));

    const existing = getStoredMetadata().filter((t) => t.id !== trackId);
    saveStoredMetadata(existing);
    return true;
  } catch (e) {
    console.error(`Failed to delete downloaded audio for track ${trackId}:`, e);
    return false;
  }
}

/**
 * Retrieves a playable Blob URL from the Cache API for 100% offline playback.
 */
export async function getOfflineAudioUrl(trackId: string): Promise<string | null> {
  if (!isOfflineSupported()) return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const matched = await cache.match(getCacheKey(trackId));
    if (!matched) return null;

    const blob = await matched.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Retrieves a cached Blob URL for track artwork when offline.
 */
export async function getOfflineArtworkUrl(trackId: string): Promise<string | null> {
  if (!isOfflineSupported()) return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const matched = await cache.match(`/offline/artwork/${encodeURIComponent(trackId)}`);
    if (!matched) return null;

    const blob = await matched.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Clears all cached downloads and metadata.
 */
export async function clearAllDownloads(): Promise<void> {
  if (!isOfflineSupported()) return;

  try {
    await caches.delete(CACHE_NAME);
    saveStoredMetadata([]);
  } catch (e) {
    console.error("Failed to clear downloads:", e);
  }
}

/**
 * Provides storage usage estimation.
 */
export async function getOfflineStorageUsage(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  trackCount: number;
}> {
  const tracks = getStoredMetadata();
  let usedBytes = 0;
  let quotaBytes = 0;

  if (isBrowser() && navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      usedBytes = est.usage || 0;
      quotaBytes = est.quota || 0;
    } catch {
      // ignore
    }
  }

  return {
    usedBytes,
    quotaBytes,
    trackCount: tracks.length,
  };
}

/**
 * Reactive React hook for component consumption of offline downloads state.
 */
export function useOfflineTracks() {
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>(() => getStoredMetadata());

  useEffect(() => {
    if (!isBrowser()) return;

    const handler = () => {
      setDownloadedTracks(getStoredMetadata());
    };

    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const isDownloaded = useCallback(
    (id: string) => downloadedTracks.some((t) => t.id === id),
    [downloadedTracks],
  );

  return {
    downloadedTracks,
    isDownloaded,
    downloadTrack: downloadTrackAudio,
    removeDownload: removeDownloadedAudio,
    clearAll: clearAllDownloads,
  };
}
