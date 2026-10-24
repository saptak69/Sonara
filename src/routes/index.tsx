import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlbumCard, PlaylistCard, TopPickCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { fetchTrending, fetchTrendingPlaylists } from "@/lib/music-api";
import { SiteFooter } from "@/components/site-footer";
import { usePlayer } from "@/lib/player-store";
import { Compass } from "lucide-react";
import { toast } from "sonner";

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
      {/* Content Sections */}
      <div className="space-y-10 md:space-y-12 px-4 md:px-10 pt-6 md:pt-8">
        
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
          {/* Discovery Station (Strictly Unheard Music) */}
          <button
            onClick={async () => {
              toast.loading("Tuning Discovery Station...", { id: "discovery" });
              try {
                const { getDiscoveryStationTracksServerFn } = await import("@/lib/recommendation-engine");
                const tracks = await getDiscoveryStationTracksServerFn({ data: { limit: 20 } });
                if (tracks.length) {
                  playTracks(tracks, 0);
                  toast.success("Playing Discovery Station", {
                    id: "discovery",
                    description: "100% unheard music tailored to your taste",
                  });
                } else {
                  toast.error("Could not find new unheard tracks right now.", { id: "discovery" });
                }
              } catch {
                toast.error("Discovery Station unavailable", { id: "discovery" });
              }
            }}
            className="group text-left w-36 sm:w-44 shrink-0 snap-start rounded-xl transition-all duration-200 ease-out focus-visible:outline-none cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#241D1A] via-[#1A1614] to-[#0E0C0B] p-4 aspect-square flex flex-col justify-between border border-white/[0.08] group-hover:border-[#FF5B2E]/40 transition-all">
              <div className="p-2.5 rounded-lg bg-white/[0.06] text-[#FF5B2E] w-max">
                <Compass className="size-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A9A19B]">Smart Mix</span>
                <h3 className="text-sm font-semibold text-[#F4EFEA] leading-tight mt-0.5">Discovery</h3>
              </div>
            </div>
            <div className="mt-2.5 px-0.5">
              <span className="block truncate text-sm font-medium text-[#F4EFEA] leading-snug lg:group-hover:text-[#FF5B2E] transition-colors">
                Discovery Station
              </span>
              <span className="block truncate text-xs text-[#7A726C] mt-0.5 leading-snug">
                Strictly unheard music
              </span>
            </div>
          </button>

          <Link
            to="/weekly-mix"
            className="group w-36 sm:w-44 shrink-0 snap-start rounded-xl transition-all duration-200 ease-out focus-visible:outline-none"
          >
            <div className="relative overflow-hidden rounded-xl bg-[#151211] border border-white/[0.06] transition-shadow duration-200">
              <Cover
                src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop"
                alt="Your Weekly Mix"
                title="Your Weekly Mix"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="mt-2.5 px-0.5">
              <span className="block truncate text-sm font-medium text-[#F4EFEA] leading-snug lg:group-hover:text-[#FF5B2E] transition-colors">
                Your Weekly Mix
              </span>
              <span className="block truncate text-xs text-[#7A726C] mt-0.5 leading-snug">
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
            <Link
              key={t.id}
              to={t.artistId ? "/artist/$id" : "/search"}
              params={t.artistId ? { id: t.artistId } : undefined}
              search={!t.artistId ? { q: t.artist } : undefined}
              className="w-32 md:w-36 shrink-0 group cursor-pointer flex flex-col items-center transition-all duration-200 ease-out active:scale-95"
            >
              <div className="w-full aspect-square rounded-full overflow-hidden border border-white/[0.08] shadow-md transition-transform duration-300 group-hover:scale-105 relative">
                <Cover src={t.artwork} alt={t.artist} className="w-full h-full object-cover" />
              </div>
              <p className="text-center font-medium text-[#F4EFEA] text-[13px] truncate w-full mt-2.5 group-hover:text-[#FF5B2E] transition-colors">{t.artist}</p>
              <p className="text-center text-xs text-[#7A726C] mt-0.5">Artist</p>
            </Link>
          ))}
        </Rail>
      </div>

      <div className="mt-16 border-t border-white/[0.06] pt-8 px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
