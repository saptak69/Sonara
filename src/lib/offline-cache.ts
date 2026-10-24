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
 */
export async function downloadTrackAudio(
  track: Track,
  onProgress?: (pct: number) => void,
): Promise<boolean> {
  if (!isOfflineSupported() || !track?.streamUrl) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = getCacheKey(track.id);

    // Determine target URL for audio
    let fetchUrl = track.streamUrl;
    if (!fetchUrl.includes("saavncdn.com") && !fetchUrl.includes("/api/stream") && !fetchUrl.startsWith("http")) {
      return false;
    }

    if (!fetchUrl.includes("saavncdn.com") && !fetchUrl.includes("/api/stream")) {
      fetchUrl = `/api/stream?url=${encodeURIComponent(fetchUrl)}`;
    }

    onProgress?.(10);
    const res = await fetch(fetchUrl);
    if (!res.ok && res.status !== 206) {
      throw new Error(`Download failed with status ${res.status}`);
    }

    onProgress?.(60);
    const blob = await res.blob();
    const storedResponse = new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "audio/mp4",
        "Content-Length": String(blob.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });

    await cache.put(cacheKey, storedResponse);
    onProgress?.(90);

    // Update metadata list
    const existing = getStoredMetadata().filter((t) => t.id !== track.id);
    saveStoredMetadata([track, ...existing]);
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
