import { createFileRoute } from "@tanstack/react-router";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { checkUpload, UPLOAD_LIMITS, type UploadCategory } from "@/lib/studio-upload";

/**
 * Studio uploads, in two steps (see src/lib/studio-upload.ts):
 * 1. JSON request -> a Vercel Blob client token when BLOB_READ_WRITE_TOKEN is set,
 *    otherwise { mode: "server" }.
 * 2. Without Blob, a multipart POST that writes the file to public/uploads (local
 *    development). Read-only hosting gets a clear error instead of a broken upload.
 */

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function asCategory(value: unknown): UploadCategory {
  return value === "artwork" ? "artwork" : "audio";
}

export const Route = createFileRoute("/api/storage/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Only signed-in artists can upload (cookie on the web, bearer token in the app).
        const { auth } = await import("@/lib/auth/server");
        const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
        if (!session?.user) return json({ error: "Sign in to upload music." }, 401);

        const isJson = (request.headers.get("content-type") ?? "").includes("application/json");

        if (isJson) {
          const body = (await request.json().catch(() => null)) as { category?: string; name?: string; size?: number } | null;
          const category = asCategory(body?.category);
          const check = checkUpload(category, String(body?.name ?? ""), Number(body?.size));
          if (!check.ok) return json({ error: check.error }, 400);

          const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
          if (!blobToken) return json({ mode: "server" });

          const { generateClientTokenFromReadWriteToken } = await import("@vercel/blob/client");
          const pathname = `${category}/${session.user.id}/${randomUUID()}.${check.ext}`;
          const clientToken = await generateClientTokenFromReadWriteToken({
            token: blobToken,
            pathname,
            allowedContentTypes: [check.mimeType],
            maximumSizeInBytes: UPLOAD_LIMITS[category].bytes,
            validUntil: Date.now() + 10 * 60 * 1000,
            addRandomSuffix: false,
          });
          return json({ mode: "blob", clientToken, pathname, mimeType: check.mimeType });
        }

        try {
          const formData = await request.formData();
          const file = formData.get("file");
          const category = asCategory(formData.get("category"));
          if (!file || typeof file === "string") return json({ error: "No file provided" }, 400);

          const check = checkUpload(category, file.name, file.size);
          if (!check.ok) return json({ error: check.error }, 400);

          const subDir = category === "audio" ? "audio" : "artwork";
          const filename = `${randomUUID()}.${check.ext}`;
          const storageKey = `${subDir}/${filename}`;

          try {
            const targetDir = join(process.cwd(), "public", "uploads", subDir);
            await mkdir(targetDir, { recursive: true });
            await writeFile(join(targetDir, filename), Buffer.from(await file.arrayBuffer()));
          } catch {
            return json(
              { error: "Uploads aren't set up on this server yet. Connect a Vercel Blob store to enable them." },
              503,
            );
          }

          return json({
            url: `/uploads/${storageKey}`,
            storageKey,
            mimeType: check.mimeType,
            fileSize: file.size,
            name: file.name,
          });
        } catch (err: unknown) {
          return json({ error: err instanceof Error ? err.message : "Upload failed" }, 500);
        }
      },
    },
  },
});
