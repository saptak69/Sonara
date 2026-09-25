import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { AlbumCard, PlaylistCard, TopPickCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { fetchTrending, fetchTrendingPlaylists } from "@/lib/music-api";
import { SiteFooter } from "@/components/site-footer";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const playTracks = usePlayer((s) => s.playTracks);
  const recents = usePlayer((s) => s.recents);

  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: () => fetchTrending(12),
  });
  const playlists = useQuery({
    queryKey: ["playlists"],
    queryFn: () => fetchTrendingPlaylists(12),
  });

  const loading = trending.isLoading && playlists.isLoading;

  if (loading) return <HomeSkeleton />;

  const topTracks = trending.data ?? [];
  const topPlaylists = playlists.data ?? [];

  // Pick a hero track for the featured banner
  const heroTrack = topTracks[0];

  return (
    <div className="w-full pb-20">
      
      {/* Apple Music Style Large Header */}
      <h1 className="font-display text-4xl md:text-[40px] font-bold text-white tracking-tight px-4 md:px-12 pt-12 pb-6">
        Home
      </h1>

      {/* ═══════════════════════════════════════════
          Content Sections — Apple Music Style
          ═══════════════════════════════════════════ */}
      <div className="space-y-12 md:space-y-14 px-4 md:px-12 mt-2">
        
        {/* Top Picks for You */}
        <section>
          <h2 className="text-xl md:text-[22px] font-bold text-fg tracking-tight mb-4">
            Top Picks for You
          </h2>
          <Rail title="">
            {topTracks.slice(0, 6).map((t, i) => {
              const labels = ["New Music Weekly", "Listen Again", "Trending", "Made for You", "New Release", "Top Hit"];
              return (
                <TopPickCard 
                  key={t.id} 
                  track={t} 
                  queue={topTracks}
                  label={labels[i] || "Made for You"} 
                />
              );
            })}
          </Rail>
        </section>

        {/* Recently Played */}
        {recents.length > 0 && (
          <section>
            <h2 className="text-xl md:text-[22px] font-bold text-fg tracking-tight mb-4 flex items-center gap-1 cursor-pointer group w-fit">
              <span className="group-hover:underline decoration-1 underline-offset-2">Recently Played</span>
              <svg className="size-4 text-muted group-hover:text-fg transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </h2>
            <Rail title="">
              {recents.map((t) => (
                <AlbumCard key={t.id} track={t} queue={recents} />
              ))}
            </Rail>
          </section>
        )}

        {/* New Music */}
        <section>
          <h2 className="text-xl md:text-[22px] font-bold text-fg tracking-tight mb-4 flex items-center gap-1 cursor-pointer group w-fit">
            <span className="group-hover:underline decoration-1 underline-offset-2">New Music</span>
            <svg className="size-4 text-muted group-hover:text-fg transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </h2>
          <Rail title="">
            {topTracks.slice(6).map((t) => (
              <AlbumCard key={t.id} track={t} queue={topTracks.slice(6)} />
            ))}
          </Rail>
        </section>

        {/* Essentials */}
        {topPlaylists.length > 0 && (
          <section>
            <h2 className="text-xl md:text-[22px] font-bold text-fg tracking-tight mb-4 flex items-center gap-1 cursor-pointer group w-fit">
              <span className="group-hover:underline decoration-1 underline-offset-2">Essentials</span>
              <svg className="size-4 text-muted group-hover:text-fg transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </h2>
            <Rail title="">
              {topPlaylists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </Rail>
          </section>
        )}

        {/* Artists You Might Like */}
        <section>
          <h2 className="text-xl md:text-[22px] font-bold text-fg tracking-tight mb-4 flex items-center gap-1 cursor-pointer group w-fit">
            <span className="group-hover:underline decoration-1 underline-offset-2">Artists You Might Like</span>
            <svg className="size-4 text-muted group-hover:text-fg transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </h2>
          <Rail title="">
            {topTracks.map((t) => (
              <div
                key={t.id}
                className="w-36 md:w-44 shrink-0 group cursor-pointer flex flex-col items-center transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:scale-[0.97] lg:hover:scale-[1.025]"
                onClick={() => playTracks([t], 0)}
              >
                <div className="w-full aspect-square rounded-full overflow-hidden shadow-md lg:group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow duration-[0.25s] relative">
                  <Cover src={t.artwork} alt={t.artist} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 lg:group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  </div>
                </div>
                <p className="text-center font-medium text-fg text-[13px] sm:text-sm truncate w-full mt-3 lg:group-hover:text-accent transition-colors">{t.artist}</p>
                <p className="text-center text-xs text-muted mt-0.5">Artist</p>
              </div>
            ))}
          </Rail>
        </section>
      </div>

      <div className="mt-16 border-t border-border/10 pt-8 px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
