import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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


  return (
    <div className="w-full pb-20">
      {/* ═══════════════════════════════════════════
          Content Sections — Apple Music Style
          ═══════════════════════════════════════════ */}
      <div className="space-y-12 md:space-y-14 px-4 md:px-12 pt-10 md:pt-12">
        

        {/* Top Picks for You */}
        <Rail title="Top Picks for You">
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

        {/* Algorithmic Smart Playlists */}
        <Rail title="Algorithmic Smart Playlists" to="/explore">
          <Link
            to="/weekly-mix"
            className="group w-40 shrink-0 snap-start sm:w-44 rounded-xl transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:scale-[0.97] lg:hover:scale-[1.025] focus-visible:outline-none"
          >
            <div className="relative overflow-hidden rounded-xl bg-surface transition-shadow duration-[0.25s] lg:group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] lg:group-hover:shadow-black/20">
              <Cover
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                alt="Your Weekly Mix"
                title="Your Weekly Mix"
                className="aspect-square w-full"
              />
            </div>
            <div className="mt-2.5 px-0.5">
              <span className="block truncate text-sm font-medium text-fg leading-snug lg:group-hover:text-accent transition-colors">
                Your Weekly Mix
              </span>
              <span className="block truncate text-xs text-muted mt-0.5 leading-snug">
                Made for you
              </span>
            </div>
          </Link>
          {topPlaylists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Rail>

        {/* Recently Played */}
        {recents.length > 0 && (
          <Rail title="Recently Played">
            {recents.map((t) => (
              <AlbumCard key={t.id} track={t} queue={recents} />
            ))}
          </Rail>
        )}

        {/* New Music */}
        <Rail title="New Music">
          {topTracks.slice(6).map((t) => (
            <AlbumCard key={t.id} track={t} queue={topTracks.slice(6)} />
          ))}
        </Rail>

        {/* Artists You Might Like */}
        <Rail title="Artists You Might Like">
          {topTracks.map((t) => (
            <div
              key={t.id}
              className="w-36 md:w-44 shrink-0 group cursor-pointer flex flex-col items-center transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:scale-[0.97] lg:hover:scale-[1.025]"
              onClick={() => playTracks([t], 0)}
            >
              <div className="w-full aspect-square rounded-full overflow-hidden shadow-md lg:group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow duration-[0.25s] relative">
                <Cover src={t.artwork} alt={t.artist} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 lg:group-hover:bg-black/20 transition-colors flex items-center justify-center" />
              </div>
              <p className="text-center font-medium text-fg text-[13px] sm:text-sm truncate w-full mt-3 lg:group-hover:text-accent transition-colors">{t.artist}</p>
              <p className="text-center text-xs text-muted mt-0.5">Artist</p>
            </div>
          ))}
        </Rail>
      </div>

      <div className="mt-16 border-t border-border/10 pt-8 px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
