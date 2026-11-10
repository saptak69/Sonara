/**
 * A cover image URL at (about) the size a screen needs. Every source serves a few
 * fixed sizes, so a 56 px thumbnail doesn't have to download the 500 px picture.
 * `px` is the width wanted in device pixels (a 56 px thumbnail on a 2x screen: 112).
 * URLs from sources with no size variants come back unchanged.
 */

const SAAVN_SIZES = [50, 150, 500];
const AUDIUS_SIZES = [150, 480, 1000];

function pick(sizes: number[], px: number): number {
  return sizes.find((size) => size >= px) ?? sizes[sizes.length - 1];
}

const FILE_END = "(?=\\.(?:jpe?g|png|webp)(?:\\?|$))";
const SAAVN_SIZE = new RegExp(`(\\d{2,3})x\\1${FILE_END}`);
const AUDIUS_SIZE = new RegExp(`(?:150x150|480x480|1000x1000)${FILE_END}`);

export function artworkAt<T extends string | null | undefined>(url: T, px: number): T {
  if (!url) return url;

  if (url.includes("saavncdn.com")) {
    const size = pick(SAAVN_SIZES, px);
    return url.replace(SAAVN_SIZE, `${size}x${size}`) as T;
  }
  if (url.includes("mzstatic.com")) {
    const size = Math.min(1000, Math.max(100, Math.ceil(px / 50) * 50));
    return url.replace(/\/(\d+)x\1bb\./, `/${size}x${size}bb.`) as T;
  }
  if (url.includes("audius")) {
    const size = pick(AUDIUS_SIZES, px);
    return url.replace(AUDIUS_SIZE, `${size}x${size}`) as T;
  }
  return url;
}
