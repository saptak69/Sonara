import { createFileRoute } from "@tanstack/react-router";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_AUDIO = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "audio/flac",
]);

const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_AUDIO_SIZE = 60 * 1024 * 1024; // 60MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export const Route = createFileRoute("/api/storage/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("file") as File | null;
          const category = (formData.get("category") as string) || "audio";

          if (!file || typeof file === "string") {
            return new Response(JSON.stringify({ error: "No file provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const mimeType = file.type || (category === "audio" ? "audio/mpeg" : "image/jpeg");
          const fileSize = file.size;

          if (category === "audio") {
            if (!ALLOWED_AUDIO.has(mimeType) && !file.name.match(/\.(mp3|wav|aac|m4a|ogg|flac)$/i)) {
              return new Response(
                JSON.stringify({ error: "Invalid audio format. Allowed: MP3, WAV, AAC, M4A, OGG, FLAC." }),
                {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }
            if (fileSize > MAX_AUDIO_SIZE) {
              return new Response(JSON.stringify({ error: "Audio file too large. Maximum size is 60MB." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }
          } else {
            if (!ALLOWED_IMAGE.has(mimeType) && !file.name.match(/\.(jpe?g|png|webp|avif)$/i)) {
              return new Response(JSON.stringify({ error: "Invalid image format. Allowed: JPG, PNG, WebP." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (fileSize > MAX_IMAGE_SIZE) {
              return new Response(JSON.stringify({ error: "Artwork file too large. Maximum size is 10MB." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }
          }

          const ext = file.name.split(".").pop()?.toLowerCase() || (category === "audio" ? "mp3" : "jpg");
          const id = randomUUID();
          const filename = `${id}.${ext}`;
          const subDir = category === "audio" ? "audio" : "artwork";

          const targetDir = join(process.cwd(), "public", "uploads", subDir);
          await mkdir(targetDir, { recursive: true });

          const filePath = join(targetDir, filename);
          const buffer = Buffer.from(await file.arrayBuffer());
          await writeFile(filePath, buffer);

          const publicUrl = `/uploads/${subDir}/${filename}`;
          const storageKey = `${subDir}/${filename}`;

          return new Response(
            JSON.stringify({
              success: true,
              url: publicUrl,
              storageKey,
              mimeType,
              fileSize,
              name: file.name,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Upload failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
