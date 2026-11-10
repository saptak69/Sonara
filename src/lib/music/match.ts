/**
 * Song identity, matching and ranking across providers.
 *
 * The confidence gate follows the approach in Parachord (MIT licence,
 * github.com/Parachord/parachord, docs/architecture/playback.md): an ISRC match is
 * certain, otherwise both the artist and the title must agree, and anything below a
 * floor is dropped before provider priority is considered, so a wrong-artist result
 * from a preferred provider can never win.
 */
import type { Track } from "../types";

export type Version =
  | "orig"
  | "remix"
  | "live"
  | "acoustic"
  | "instrumental"
  | "sped-up"
  | "slowed"
  | "lofi"
  | "karaoke"
  | "cover";

export const MIN_CONFIDENCE = 0.6;

// Combining accents U+0300–U+036F, built from code points so the source stays readable.
const LATIN_ACCENTS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, "g");

/** Lower-case, strip accents and punctuation; keeps letters of every script (Hindi, Bengali, ...). */
export function norm(text: string | undefined | null): string {
  return (text ?? "")
    .normalize("NFKD")
    // Only Latin accents (U+0300–036F). Indic vowel signs are marks too and must stay.
    .replace(LATIN_ACCENTS, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const VERSION_PATTERNS: [Version, RegExp][] = [
  ["karaoke", /\bkaraoke\b/i],
  ["instrumental", /\binstrumental\b/i],
  ["sped-up", /\bsped\s*up\b|\bnightcore\b/i],
  ["slowed", /\bslowed\b|\breverb\b/i],
  ["lofi", /\blo-?fi\b/i],
  ["acoustic", /\bacoustic\b|\bunplugged\b/i],
  ["live", /\blive\b(?!\s+(?:and|while|forever|it up)\b)/i],
  ["cover", /\bcover\b/i],
  ["remix", /\bremix\b|\b(?:club|extended|dub|vip)\s+mix\b|\bmashup\b|\bflip\b|\bbootleg\b/i],
];

/** Text inside brackets or after " - " that marks a version, credit or source note. */
function decorations(title: string): string[] {
  const parts: string[] = [];
  for (const m of title.matchAll(/[([{]([^)\]}]*)[)\]}]/g)) parts.push(m[1]);
  const dash = title.split(/\s+[-–—]\s+/);
  if (dash.length > 1) parts.push(...dash.slice(1));
  return parts;
}

export function versionOf(title: string): Version {
  for (const part of decorations(title)) {
    for (const [version, pattern] of VERSION_PATTERNS) {
      if (pattern.test(part)) return version;
    }
  }
  return "orig";
}

/** Title without brackets or " - …" suffixes, normalised. "Song (Remix) - 2011 Remaster" -> "song". */
export function baseTitle(title: string): string {
  const stripped = title
    .replace(/[([{][^)\]}]*[)\]}]/g, " ")
    .split(/\s+[-–—]\s+/)[0];
  return norm(stripped) || norm(title);
}

/** "A, B & C feat. D" -> ["a", "b", "c", "d"]. */
export function splitArtists(artist: string | undefined | null): string[] {
  return (artist ?? "")
    .replace(/^@/, "")
    .split(/\s*(?:,|&|\band\b|\bx\b|\bfeat\.?|\bft\.?|\bfeaturing\b|\bwith\b|\/|;)\s*/i)
    .map(norm)
    .filter(Boolean);
}

export function identityKey(track: Pick<Track, "title" | "artist"> & { isrc?: string }): string {
  if (track.isrc) return `isrc:${track.isrc.toUpperCase()}`;
  return `n:${splitArtists(track.artist)[0] ?? ""}|${baseTitle(track.title)}|${versionOf(track.title)}`;
}

function artistsOverlap(a: string, b: string): boolean {
  const left = splitArtists(a);
  const right = splitArtists(b);
  return left.some((x) => right.some((y) => x === y || x.includes(y) || y.includes(x)));
}

function titlesMatch(a: string, b: string): boolean {
  const x = baseTitle(a);
  const y = baseTitle(b);
  return x === y || (x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x)));
}

type Matchable = Pick<Track, "title" | "artist" | "duration"> & { isrc?: string };

/** How sure we are that two results are the same recording (0..1). */
export function confidence(a: Matchable, b: Matchable): number {
  if (a.isrc && b.isrc) return a.isrc.toUpperCase() === b.isrc.toUpperCase() ? 1 : 0;
  const artist = artistsOverlap(a.artist, b.artist);
  const title = titlesMatch(a.title, b.title);
  if (!artist || !title) return artist || title ? 0.5 : 0;
  if (versionOf(a.title) !== versionOf(b.title)) return 0.5;
  const gap = a.duration > 0 && b.duration > 0 ? Math.abs(a.duration - b.duration) : 0;
  if (gap > 10) return 0.7;
  return 0.95;
}

/** Prefer a full stream over a preview; otherwise keep the earlier (higher-priority) result. */
function better(current: Track, candidate: Track): Track {
  if (current.preview && !candidate.preview) return { ...candidate, isrc: candidate.isrc ?? current.isrc };
  return current.isrc || !candidate.isrc ? current : { ...current, isrc: candidate.isrc };
}

/**
 * Merges result lists given in provider-priority order. The same recording found by
 * several providers becomes one entry.
 */
export function mergeTracks(lists: Track[][]): Track[] {
  const merged: Track[] = [];
  const byKey = new Map<string, number>();
  const byTitle = new Map<string, number[]>();

  for (const list of lists) {
    for (const track of list) {
      const key = identityKey(track);
      const nameKey = identityKey({ title: track.title, artist: track.artist });
      let at = byKey.get(key) ?? byKey.get(nameKey);
      if (at == null) {
        const title = baseTitle(track.title);
        at = (byTitle.get(title) ?? []).find((i) => confidence(merged[i], track) >= 0.95);
      }
      if (at != null) {
        merged[at] = better(merged[at], track);
      } else {
        at = merged.length;
        merged.push(track);
        const title = baseTitle(track.title);
        byTitle.set(title, [...(byTitle.get(title) ?? []), at]);
      }
      byKey.set(key, at);
      byKey.set(nameKey, at);
    }
  }
  return merged;
}

/** Orders search results by how well they answer the query. */
export function rankTracks(tracks: Track[], query: string): Track[] {
  const q = norm(query);
  const qTokens = q.split(" ").filter(Boolean);
  if (!qTokens.length) return tracks;
  const asksForVersion = versionOf(`(${query})`);

  const scored = tracks.map((track, position) => {
    const title = baseTitle(track.title);
    const artists = splitArtists(track.artist);
    const words = new Set(`${title} ${artists.join(" ")}`.split(" "));
    const covered = qTokens.filter(
      (token, i) => words.has(token) || (i === qTokens.length - 1 && [...words].some((w) => w.startsWith(token))),
    ).length;

    let score = 40 * (covered / qTokens.length);
    if (title === q) {
      score += 50;
    } else {
      // Artist bonuses only when the query says more than the title, so an artist that
      // happens to share the song's name ("LoFi Chill" by "LoFi Chill") gets no double credit.
      if (title.startsWith(q)) score += 15;
      if (artists.some((a) => a === q)) score += 20;
      if (q.includes(title) && artists.some((a) => q.includes(a))) score += 35;
    }

    const version = versionOf(track.title);
    if (version !== "orig" && version !== asksForVersion) score -= 25;
    if (track.preview) score -= 15;
    score += Math.log10((track.playCount ?? 0) + 1);
    score += 8 * (1 - position / tracks.length);
    return { track, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.track);
}
