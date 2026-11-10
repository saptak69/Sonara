/**
 * Picks the right LRCLIB entry for a song. Different versions of a song (radio
 * edit, extended mix, live) share a title but not a length, so duration is the
 * main tie-breaker: synced lines from the wrong version drift out of time.
 */

export type LrclibEntry = {
  trackName?: string;
  artistName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

/** Seconds two durations may differ and still be the same recording. */
export const DURATION_TOLERANCE_S = 4;

/** Title as LRCLIB stores it: no soundtrack notes, featuring credits or remaster tags. */
export function cleanTitleForLyrics(title: string): string {
  return title
    .replace(/\s*[([]\s*(from|feat\.?|ft\.?|featuring|with)\b[^)\]]*[)\]]/gi, "")
    .replace(/\s+-\s+(\d{4}\s+)?remaster(ed)?(\s+\d{4})?.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** First credited artist: "A, B & C" -> "A". */
export function primaryArtist(artist: string): string {
  return artist.replace(/^@/, "").split(/,|&| x | feat\.? | ft\.? /i)[0].trim();
}

function hasLyrics(entry: LrclibEntry): boolean {
  return Boolean(entry.syncedLyrics || entry.plainLyrics || entry.instrumental);
}

export function pickLyricsEntry(entries: LrclibEntry[], durationS?: number): LrclibEntry | null {
  const usable = entries.filter(hasLyrics);
  if (!usable.length) return null;

  const known = durationS != null && durationS > 0;
  const gap = (entry: LrclibEntry) =>
    known && entry.duration != null ? Math.abs(entry.duration - durationS) : Number.POSITIVE_INFINITY;

  if (known) {
    const sameLength = usable
      .filter((entry) => gap(entry) <= DURATION_TOLERANCE_S)
      .sort((a, b) => Number(Boolean(b.syncedLyrics)) - Number(Boolean(a.syncedLyrics)) || gap(a) - gap(b));
    if (sameLength.length) return sameLength[0];

    // No entry matches this length. Synced lines would drift, so only plain text is safe.
    const plain = usable.find((entry) => entry.plainLyrics || entry.instrumental);
    return plain ? { ...plain, syncedLyrics: null } : null;
  }

  return usable.find((entry) => entry.syncedLyrics) ?? usable[0];
}
