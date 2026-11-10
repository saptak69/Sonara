/**
 * Studio uploads.
 *
 * On Vercel the browser sends the file straight to Vercel Blob with a short-lived
 * token from our server, so files skip the 4.5 MB function body limit and never
 * pass through a function. Without a Blob store (local development) the file is
 * posted to the server, which writes it to public/uploads.
 */

export type UploadCategory = "audio" | "artwork";

export type UploadedFile = {
  url: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  name: string;
};

const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  flac: "audio/flac",
};
const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export const UPLOAD_LIMITS: Record<UploadCategory, { bytes: number; label: string; types: Record<string, string> }> = {
  audio: { bytes: 60 * 1024 * 1024, label: "60 MB", types: AUDIO_TYPES },
  artwork: { bytes: 10 * 1024 * 1024, label: "10 MB", types: IMAGE_TYPES },
};

export type UploadCheck =
  | { ok: true; ext: string; mimeType: string }
  | { ok: false; error: string };

/** Checks a file by extension and size; the extension decides the stored content type. */
export function checkUpload(category: UploadCategory, name: string, size: number): UploadCheck {
  const limits = UPLOAD_LIMITS[category];
  const ext = (name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const mimeType = limits.types[ext];
  if (!mimeType) {
    const allowed = [...new Set(Object.keys(limits.types).map((e) => e.replace("jpeg", "jpg").toUpperCase()))].join(", ");
    return { ok: false, error: `That file type isn't supported. Use ${allowed}.` };
  }
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: "The file is empty." };
  if (size > limits.bytes) return { ok: false, error: `The file is larger than ${limits.label}.` };
  return { ok: true, ext, mimeType };
}

type TokenResponse =
  | { mode: "blob"; clientToken: string; pathname: string; mimeType: string }
  | { mode: "server" }
  | { error: string };

export async function uploadStudioFile(
  file: File,
  category: UploadCategory,
  headers: HeadersInit = {},
): Promise<UploadedFile> {
  const check = checkUpload(category, file.name, file.size);
  if (!check.ok) throw new Error(check.error);

  const tokenRes = await fetch("/api/storage/upload", {
    method: "POST",
    credentials: "include",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ category, name: file.name, size: file.size }),
  });
  const token = (await tokenRes.json().catch(() => ({ error: "Upload failed" }))) as TokenResponse;
  if (!tokenRes.ok || "error" in token) throw new Error("error" in token ? token.error : "Upload failed");

  if (token.mode === "blob") {
    const { put } = await import("@vercel/blob/client");
    const blob = await put(token.pathname, file, {
      access: "public",
      token: token.clientToken,
      contentType: token.mimeType,
      multipart: file.size > 8 * 1024 * 1024,
    });
    return { url: blob.url, storageKey: blob.pathname, mimeType: token.mimeType, fileSize: file.size, name: file.name };
  }

  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  const res = await fetch("/api/storage/upload", { method: "POST", body: form, headers, credentials: "include" });
  const data = (await res.json().catch(() => ({ error: "Upload failed" }))) as UploadedFile & { error?: string };
  if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
  return data;
}
