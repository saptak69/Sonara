import { createFileRoute, Link } from "@tanstack/react-router";
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

  return (
    <div className="w-full pb-20">
      {/* Hero Banner Area */}
      <section className="relative w-full h-[55vh] min-h-[400px] max-h-[600px] flex flex-col justify-end p-8 md:p-12 overflow-hidden bg-surface group">
        {/* Abstract Sunset Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c0d0a] via-[#3d130f] to-[#ff4a3a] opacity-80" />
          <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-bg to-transparent opacity-60" />
          <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-bg to-transparent" />
          
          {/* Subtle glowing orbs */}
          <div className="absolute top-1/4 right-1/4 size-[40vw] bg-[#ff6a3a] rounded-full blur-[120px] mix-blend-screen opacity-40 animate-pulse duration-10000" />
          <div className="absolute bottom-1/4 left-1/3 size-[30vw] bg-[#ff4a3a] rounded-full blur-[100px] mix-blend-screen opacity-30" />
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          <p className="text-accent text-sm font-semibold tracking-[0.2em] uppercase mb-3 animate-in slide-in-from-bottom-4 fade-in duration-700">
            Memory Lanes Exclusive
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-medium leading-[1.1] tracking-tight mb-8 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150 fill-mode-both">
            Music for a warmer tomorrow
          </h1>
          <div className="flex items-center gap-4 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-300 fill-mode-both">
            <button
              onClick={() => {
                if (topTracks.length) {
                  const randomIndex = Math.floor(Math.random() * topTracks.length);
                  playTracks(topTracks, randomIndex);
                }
              }}
              className="px-8 py-3.5 bg-accent text-white rounded-full font-medium shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all text-sm md:text-base flex items-center gap-2"
            >
              <Play className="size-5 fill-current" />
              Listen Now
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
      </section>

      {/* Main Content Rows */}
      <div className="px-4 md:px-8 space-y-12 mt-12">
        <section className="space-y-4">
          <h2 className="font-display text-2xl md:text-3xl font-medium text-white px-2">Made for You</h2>
          <Rail title="">
            {topPlaylists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </Rail>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl md:text-3xl font-medium text-white px-2">Trending Now</h2>
          <Rail title="">
            {topTracks.map((t) => (
              <AlbumCard key={t.id} track={t} queue={topTracks} />
            ))}
          </Rail>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl md:text-3xl font-medium text-white px-2">Artists You Might Like</h2>
          <Rail title="">
            {topTracks.map((t) => (
              <div key={t.id} className="w-32 md:w-44 shrink-0 group cursor-pointer flex flex-col items-center">
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
        </section>
      </div>

      <div className="mt-20 border-t border-border/50 pt-8 px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
