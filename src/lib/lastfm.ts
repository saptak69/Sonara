import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const scrobbleTrackServerFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string(),
      artist: z.string(),
      lastfmUsername: z.string().nullable().optional(),
    })
  )
  .handler(async ({ data }) => {
    // In a real application, you would need to implement Last.fm's authentication
    // flow (auth.getSession) to get a session key for the user, and then use that
    // session key with their API key and shared secret to sign the track.scrobble request.
    
    // For now, this is a placeholder that logs the scrobble intent.
    console.log(`[Last.fm] Scrobble requested for ${data.lastfmUsername}: ${data.title} by ${data.artist}`);
    
    // Simulate successful scrobble
    return { success: true };
  });
