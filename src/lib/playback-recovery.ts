/**
 * Decides what the player tries next when a stream fails.
 *
 * Every fallback has a key, and the engine records the keys it has tried for the
 * current track. A step is never repeated, so recovery always moves forward and
 * ends in a skip instead of looping or stalling.
 */

export type RecoveryStep =
  | { kind: "src"; key: RecoveryKey; src: string }
  | { kind: "resolve"; key: RecoveryKey }
  | { kind: "skip" };

export type RecoveryKey = "lower-bitrate" | "proxy" | "resolve";

export type RecoveryInput = {
  /** The track's canonical stream URL. */
  streamUrl: string;
  /** What the failing <audio> element was playing. */
  currentSrc: string;
  /** Keys already tried for this track. */
  tried: ReadonlySet<string>;
  /** Live radio has no alternative source to resolve. */
  isRadio: boolean;
};

const PROXY_PREFIX = "/api/stream?url=";

export function proxiedUrl(url: string): string {
  return `${PROXY_PREFIX}${encodeURIComponent(url)}`;
}

function isProxied(src: string): boolean {
  return src.includes("/api/stream");
}

function isLocal(src: string): boolean {
  return src.startsWith("blob:") || src.startsWith("data:");
}

export function nextRecoveryStep({ streamUrl, currentSrc, tried, isRadio }: RecoveryInput): RecoveryStep {
  const remote = /^https?:\/\//.test(streamUrl);

  if (!tried.has("lower-bitrate") && /saavncdn\.com/.test(streamUrl) && /_320\.(mp4|m4a)/.test(streamUrl)) {
    return { kind: "src", key: "lower-bitrate", src: streamUrl.replace(/_320\.(mp4|m4a)/, "_160.$1") };
  }

  if (!tried.has("proxy") && remote && !isProxied(currentSrc) && !isLocal(currentSrc)) {
    return { kind: "src", key: "proxy", src: proxiedUrl(streamUrl) };
  }

  if (!tried.has("resolve") && !isRadio) {
    return { kind: "resolve", key: "resolve" };
  }

  return { kind: "skip" };
}
