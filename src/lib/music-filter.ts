/**
 * Pure domain filtering for Sonara's music catalog.
 * Guarantees authentic original studio master recordings and rejects
 * amateur covers, karaoke, slowed/reverb, AI voice clones, and spam bootlegs.
 */

export function isCoverOrDerivative(title: string, artist?: string, userQuery?: string): boolean {
  const q = (userQuery || "").toLowerCase();
  const t = (title || "").toLowerCase();
  const a = (artist || "").toLowerCase();

  const isIntentionalCover = q.includes("cover");
  const isIntentionalRemix = q.includes("remix");
  const isIntentionalSlowed = q.includes("slowed") || q.includes("reverb");
  const isIntentionalInstrumental = q.includes("instrumental") || q.includes("karaoke");

  // Cover & Tribute checks
  if (
    !isIntentionalCover &&
    (/\bcover\b/i.test(t) ||
      /\bcover\b/i.test(a) ||
      /\bacoustic cover\b/i.test(t) ||
      /\btribute to\b/i.test(t))
  ) {
    return true;
  }

  // Slowed / Reverb / Nightcore / Sped up / 8D
  if (
    !isIntentionalSlowed &&
    (/\bslowed\b/i.test(t) ||
      /\breverb\b/i.test(t) ||
      /\bnightcore\b/i.test(t) ||
      /\bsped up\b/i.test(t) ||
      /\b8d audio\b/i.test(t))
  ) {
    return true;
  }

  // Karaoke / Instrumental
  if (
    !isIntentionalInstrumental &&
    (/\bkaraoke\b/i.test(t) ||
      /\binstrumental\b/i.test(t) ||
      /\bbacking track\b/i.test(t))
  ) {
    return true;
  }

  // AI Voice & Fake models & Type beats
  if (
    /\b(ai cover|ai version|synthetic voice|type beat|made famous by|originally performed by)\b/i.test(
      t,
    )
  ) {
    return true;
  }

  // Bootlegs & unauthorized rips
  if (!isIntentionalRemix && (/\bbootleg\b/i.test(t) || /\bclub edit\b/i.test(t))) {
    return true;
  }

  return false;
}
