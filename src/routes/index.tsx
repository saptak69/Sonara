import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { AlbumCard, PlaylistCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { Button } from "@/components/ui/button";
import { fetchTrending, fetchTrendingPlaylists } from "@/lib/music-api";
import { SiteFooter } from "@/components/site-footer";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Meteors } from "@/components/ui/meteors";
import { ParallaxCarousel } from "@/components/ui/parallax-carousel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const playTracks = usePlayer((s) => s.playTracks);
  const recents = usePlayer((s) => s.recents);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

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

  return (
    <div className="w-full pb-20">
      {/* Hero Banner Area */}
      <AuroraBackground className="!h-[55vh] !min-h-[400px] !max-h-[600px] justify-end items-start p-8 md:p-12 overflow-hidden group border-b border-border/50 bg-gradient-to-tr max-md:from-bg max-md:via-bg max-md:to-accent/10">
        {isDesktop && (
          <div className="max-md:hidden w-full h-full absolute inset-0">
            <Meteors number={12} className="opacity-40" />
          </div>
        )}
        
        {/* Abstract Dark Overlay (To ensure text readability over aurora) */}
        <div className="absolute inset-0 z-0">
          {/* Endless Parallax Carousel - Unmounted on mobile for performance */}
          {isDesktop && (
            <div className="max-md:hidden w-full h-full absolute inset-0">
              <ParallaxCarousel images={topTracks.map(t => t.artwork).filter(Boolean)} />
            </div>
          )}

          <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-bg to-transparent opacity-60 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          <p className="text-accent text-sm font-semibold tracking-[0.2em] uppercase mb-3 animate-in slide-in-from-bottom-4 fade-in duration-700">
            Sonara Exclusive
          </p>
          <h1 className="font-display text-[clamp(3.25rem,8vw,5.5rem)] text-white font-medium leading-[1.05] tracking-tight mb-8">
            <span className="inline-block animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150 fill-mode-both">Music</span>{" "}
            <span className="inline-block animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300 fill-mode-both">for</span>{" "}
            <span className="inline-block animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-500 fill-mode-both">a</span>{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#ff4a3a] to-[#ff8a6a] animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-700 fill-mode-both">warmer tomorrow</span>
          </h1>
          <div className="flex items-center gap-4 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-1000 fill-mode-both">
            <button
              onClick={() => {
                if (topTracks.length) {
                  const randomIndex = Math.floor(Math.random() * topTracks.length);
                  playTracks(topTracks, randomIndex);
                }
              }}
              className="relative group px-8 py-3.5 bg-accent text-white rounded-full font-medium hover:scale-105 active:scale-95 transition-all text-sm md:text-base flex items-center gap-2 overflow-hidden"
            >
              {/* Glow Pulse */}
              <div className="absolute inset-0 bg-white/20 blur-md animate-pulse group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
              <Play className="size-5 fill-current relative z-10" />
              <span className="relative z-10">Listen Now</span>
            </button>
            <button 
              onClick={() => {
                const pool = recents.length > 0 ? recents : topTracks;
                if (!pool.length) return;
                const shuffled = [...pool].sort(() => Math.random() - 0.5);
                playTracks(shuffled, 0);
              }}
              className="px-8 py-3.5 bg-white/10 backdrop-blur-md text-white rounded-full font-medium hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              Shuffle
            </button>
          </div>
        </div>
      </AuroraBackground>

      {/* Main Content Rows */}
      <div className="flex flex-col mt-16 md:mt-24 gap-20 md:gap-24">
        {/* Made for You - Chill Mood */}
        <section className="relative w-full py-12 -my-12">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-[0.04] md:mix-blend-screen md:scale-110"
              style={{ 
                backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
              }} 
            />
            <div className="md:animate-[float_30s_ease-in-out_infinite_alternate] absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/80 to-bg" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-transparent to-bg" />
          </div>
          <div className="relative z-10 px-4 md:px-12 space-y-6">
            <h2 className="font-display text-2xl md:text-4xl font-medium text-white tracking-tight">Made for You</h2>
            <Rail title="">
              {topPlaylists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </Rail>
          </div>
        </section>

        {/* Trending Now - Energetic Mood */}
        <section className="relative w-full py-12 -my-12">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-[0.05] md:mix-blend-screen md:scale-110"
              style={{ 
                backgroundImage: 'url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop")',
              }} 
            />
            <div className="md:animate-[float_25s_ease-in-out_infinite_alternate-reverse] absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/80 to-bg" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-transparent to-bg" />
          </div>
          <div className="relative z-10 px-4 md:px-12 space-y-6">
            <h2 className="font-display text-2xl md:text-4xl font-medium text-white tracking-tight">Trending Now</h2>
            <Rail title="">
              {topTracks.map((t) => (
                <AlbumCard key={t.id} track={t} queue={topTracks} />
              ))}
            </Rail>
          </div>
        </section>

        {/* Artists You Might Like - Nostalgic Mood */}
        <section className="relative w-full py-12 -my-12">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-[0.04] md:mix-blend-screen md:scale-110"
              style={{ 
                backgroundImage: 'url("https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=2000&auto=format&fit=crop")',
              }} 
            />
            <div className="md:animate-[float_35s_ease-in-out_infinite_alternate] absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/80 to-bg" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-transparent to-bg" />
          </div>
          <div className="relative z-10 px-4 md:px-12 space-y-6">
            <h2 className="font-display text-2xl md:text-4xl font-medium text-white tracking-tight">Artists You Might Like</h2>
            <Rail title="">
              {topTracks.map((t) => (
                <div 
                  key={t.id} 
                  onPointerDown={() => {
                    try {
                      const { Haptics, ImpactStyle } = require("@capacitor/haptics");
                      Haptics.impact({ style: ImpactStyle.Light });
                    } catch(e) {}
                  }}
                  className="w-32 md:w-44 shrink-0 group cursor-pointer flex flex-col items-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.92] active:duration-100"
                >
                  <div className="w-full aspect-square rounded-full overflow-hidden mb-3 shadow-lg group-hover:shadow-accent/20 transition-all border border-border group-hover:border-accent/50 relative">
                    <Cover src={t.artwork} alt={t.artist} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="size-8 text-white fill-current" />
                    </div>
                  </div>
                  <p className="text-center font-medium text-fg text-sm truncate w-full group-hover:text-accent transition-colors">{t.artist}</p>
                  <p className="text-center text-xs text-muted mt-1 uppercase tracking-widest">Artist</p>
                </div>
              ))}
            </Rail>
          </div>
        </section>
      </div>

      <div className="mt-20 border-t border-border/50 pt-8 px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
