/**
 * Pure domain filtering for Sonara's music catalog.
 * Guarantees authentic original studio master recordings and rejects
 * amateur covers, karaoke, slowed/reverb, AI voice clones, and spam bootlegs.
 *
 * Designed with precision context-matching to avoid false positives on legitimate
 * studio recordings that contain words like "cover" (e.g. "Cover Me In Sunshine",
 * "Under Cover of Darkness", "Cover Girl", "Deep Cover").
 */

/**
 * Specifically checks if the title or artist indicates an amateur or derivative cover,
 * while safeguarding legitimate songs that use "cover" as part of their lyrical title.
 */
function isCoverTrack(t: string, a: string): boolean {
  // 1. Bracketed or parenthesized cover descriptors:
  // e.g. "(Cover)", "(Acoustic Cover)", "[Piano Cover]", "(Cover by Boyce Avenue)", "(Taylor Swift Cover)"
  if (
    /[([{\/](?:[^\w\s]*\s*)?(?:acoustic\s+|piano\s+|guitar\s+|rock\s+|metal\s+|jazz\s+|live\s+|female\s+|male\s+|lo-?fi\s+|violin\s+|drum\s+)?cover(?:\s+(?:version|by|edit|video))?[^\w\s]*[)\]}\/]/i.test(
      t,
    )
  ) {
    return true;
  }

  // 2. Separated by delimiter: " - Cover", " – Acoustic Cover", " : Piano Cover", " | Cover"
  if (
    /[-–—:|]\s*(?:acoustic\s+|piano\s+|guitar\s+|rock\s+|lo-?fi\s+)?cover(?:\s+by|\s+version)?(?:\s*[-–—:|]|$)/i.test(
      t,
    )
  ) {
    return true;
  }

  // 3. Explicit cover adjective / prefix / suffix phrases in title:
  // "Acoustic Cover", "Piano Cover", "Cover Version", "Cover by ...", "My Cover of ..."
  if (/\b(?:acoustic|piano|guitar|violin|metal|rock|punk|lo-?fi|jazz|orchestral)\s+cover\b/i.test(t)) {
    return true;
  }
  if (/\bcover\s+(?:version|by\b)/i.test(t)) {
    return true;
  }
  if (/(?:^|\b(?:my|our|a)\s+)cover\s+of\b/i.test(t)) {
    return true;
  }

  // 4. Standalone "Cover" at the start or end of title
  if (/^cover\s*[-–—:]/i.test(t) || /[-–—:]\s*cover$/i.test(t) || /^cover$/i.test(t.trim())) {
    return true;
  }

  // 5. Tribute and soundalike phrases
  if (
    /\b(?:tribute to|in the style of|originally performed by|originally by|as made famous by|soundalike)\b/i.test(
      t,
    )
  ) {
    return true;
  }

  // 6. Artist field checks (e.g. "Cover Band", "Tribute Band", "Karaoke Band")
  if (
    /\b(?:cover\s+band|tribute\s+band|tribute\s+orchestra|tribute\s+project|karaoke\s+band|the\s+tribute)\b/i.test(
      a,
    )
  ) {
    return true;
  }
  if (/^tribute to\b/i.test(a)) {
    return true;
  }

  return false;
}

/**
 * Checks for viral derivative edits (Slowed, Reverb, Nightcore, Sped up, 8D audio, Jhankar, Bass Boosted)
 */
function isDerivativeEdit(t: string): boolean {
  // Slowed / Reverb combinations
  if (/\b(?:slowed\s*(?:\+|&|and)?\s*reverb|slowed\s+down|reverb\s+edit)\b/i.test(t)) {
    return true;
  }
  // Bracketed or hyphenated derivative tags
  if (
    /[-–—:|([{\/]\s*(?:slowed|reverb|nightcore|sped\s*up|speed\s*up|8d\s*audio|16d\s*audio|3d\s*audio|daycore|bass\s*boosted|mega\s*bass|pitch\s*shifted|chipmunk)\b/i.test(t)
  ) {
    return true;
  }
  // Standalone viral remix / nightcore / audio modification tags
  if (
    /\b(?:nightcore|8d\s*audio|16d\s*audio|daycore|bass\s*boosted|mega\s*bass|car\s*bass|chipmunk|pitch\s*shifted)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/\b(?:sped\s*up|speed\s*up)\s*(?:version|edit)?\b/i.test(t)) {
    return true;
  }
  // Amateur South Asian synthetic overlays (Jhankar, Dholki mix, DJ remix bootlegs)
  if (/\b(?:jhankar\s*beats?|sonic\s*jhankar|dholki\s*mix|dholak\s*mix|dj\s*jhankar)\b/i.test(t)) {
    return true;
  }
  // Lo-Fi amateur derivatives
  if (/[-–—:|([{\/]\s*lo-?fi\s*(?:remix|flip|edit|version)\b/i.test(t)) {
    return true;
  }
  return false;
}

/**
 * Checks for karaoke or amateur backing tracks
 */
function isKaraokeOrBacking(t: string): boolean {
  if (/\bkaraoke\b/i.test(t) || /\bbacking\s+track\b/i.test(t)) {
    return true;
  }
  // Bracketed or suffixed instrumental: "(Instrumental)", "- Instrumental"
  if (/[-–—:|([{\/]\s*instrumental(?:\s+version)?\s*[)\]}]?/i.test(t)) {
    return true;
  }
  return false;
}

/**
 * Checks for synthetic voices, fake AI models, and type beats
 */
function isAiOrSynthetic(t: string): boolean {
  return /\b(ai\s+cover|ai\s+version|synthetic\s+voice|ai\s+vocals|ai\s+duet|type\s+beat|vocaloid\s+cover|ai\s+generated)\b/i.test(
    t,
  );
}

/**
 * Checks for unauthorized bootlegs or audio leaks
 */
function isBootlegOrRip(t: string): boolean {
  return /\b(bootleg\s+remix|unauthorized\s+bootleg|studio\s+leak|audio\s+rip|unreleased\s+rip|tiktok\s+version|tik\s*tok\s+edit)\b/i.test(
    t,
  );
}

export function isCoverOrDerivative(title: string, artist?: string, userQuery?: string): boolean {
  const q = (userQuery || "").toLowerCase();
  const t = (title || "").toLowerCase();
  const a = (artist || "").toLowerCase();

  const isIntentionalCover = q.includes("cover");
  const isIntentionalRemix = q.includes("remix") || q.includes("bootleg");
  const isIntentionalSlowed =
    q.includes("slowed") || q.includes("reverb") || q.includes("nightcore") || q.includes("sped");
  const isIntentionalInstrumental = q.includes("instrumental") || q.includes("karaoke");

  // Cover & Tribute checks (with smart legitimate-title protection)
  if (!isIntentionalCover && isCoverTrack(t, a)) {
    return true;
  }

  // Slowed / Reverb / Nightcore / Sped up / 8D
  if (!isIntentionalSlowed && isDerivativeEdit(t)) {
    return true;
  }

  // Karaoke / Backing tracks
  if (!isIntentionalInstrumental && isKaraokeOrBacking(t)) {
    return true;
  }

  // AI Voice & Fake models & Type beats
  if (isAiOrSynthetic(t)) {
    return true;
  }

  // Bootlegs & unauthorized rips
  if (!isIntentionalRemix && isBootlegOrRip(t)) {
    return true;
  }

  return false;
}
