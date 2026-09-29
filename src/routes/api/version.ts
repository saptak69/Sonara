import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/version")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            version: "1.0.1",
            downloadUrl: "https://github.com/saptak69/Sonara/releases/latest/download/app-release.apk",
            releaseNotes: "Added Weekly Mix and smart retention notifications!"
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
  },
});
