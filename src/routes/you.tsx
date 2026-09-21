import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/cover";
import { Clock, Heart, PlayCircle, LogOut, Radio, User } from "lucide-react";
import { signOut } from "@/lib/auth/client";

export const Route = createFileRoute("/you")({
  component: YouPage,
});

function YouPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && (!user || user.isDevFallback)) {
      void navigate({ to: "/login" });
    }
  }, [user, isPending, navigate]);

  if (isPending || !user || user.isDevFallback) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="size-24 rounded-full bg-surface" />
          <div className="h-6 w-32 bg-surface rounded-md" />
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/" });
  };

  return (
    <div className="pb-32 px-4 md:px-8 max-w-5xl mx-auto pt-8 animate-in fade-in duration-500">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-12">
        <div className="relative group">
          <Cover 
            src={user.profileImageUrl || ""} 
            alt={user.displayName || "User"} 
            rounded="full" 
            className="size-32 md:size-40 lg:size-48 border-4 border-surface shadow-2xl transition-transform group-hover:scale-105" 
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Profile</h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-fg mb-4 tracking-tight">
            {user.displayName || "Listener"}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm text-muted">
            <span className="flex items-center gap-2 bg-surface/50 px-3 py-1.5 rounded-full border border-border/50">
              <Heart className="size-4 text-red-400" /> 12 Favorites
            </span>
            <span className="flex items-center gap-2 bg-surface/50 px-3 py-1.5 rounded-full border border-border/50">
              <Clock className="size-4 text-blue-400" /> 34h Listened
            </span>
            <span className="flex items-center gap-2 bg-surface/50 px-3 py-1.5 rounded-full border border-border/50">
              <Radio className="size-4 text-green-400" /> 5 Stations
            </span>
          </div>
        </div>
        <div className="flex gap-3 mt-6 md:mt-0 w-full md:w-auto px-4 md:px-0">
          <Link to="/studio" className="flex-1 md:flex-none">
            <Button variant="solid" className="w-full rounded-full bg-surface hover:bg-hover border border-border text-fg font-medium">
              Creator Studio
            </Button>
          </Link>
          <Button 
            variant="solid" 
            onClick={handleSignOut} 
            className="flex-1 md:flex-none rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium"
          >
            <LogOut className="size-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Profile Stats / Recent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-fg">
            <PlayCircle className="size-5 text-accent" /> Recently Played
          </h3>
          <div className="relative overflow-hidden bg-surface/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] group">
            {/* Spinning Vinyl */}
            <div className="relative size-32 mb-6 group-hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-900 to-black rounded-full shadow-2xl animate-[vinyl-spin_4s_linear_infinite]">
                 <div className="absolute inset-2 border border-white/5 rounded-full" />
                 <div className="absolute inset-4 border border-white/5 rounded-full" />
                 <div className="absolute inset-6 border border-white/5 rounded-full" />
                 <div className="absolute inset-8 border border-white/5 rounded-full" />
                 <div className="absolute inset-10 bg-gradient-to-br from-accent to-[#ff8a6a] rounded-full flex items-center justify-center shadow-inner">
                   <div className="size-3 bg-black rounded-full border border-white/20" />
                 </div>
              </div>
            </div>
            
            <p className="text-fg font-medium mb-2 text-lg">It's a little quiet here</p>
            <p className="text-muted text-sm max-w-[220px] mb-6">Your recent listening history will appear here once you start playing music.</p>
            <Link to="/explore">
              <button className="px-6 py-2.5 bg-accent text-white rounded-full font-medium shadow-lg shadow-accent/20 hover:scale-105 transition-all animate-pulse duration-2000">
                Discover new music
              </button>
            </Link>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-fg">
            <Heart className="size-5 text-red-400" /> Top Artists
          </h3>
          <div className="relative overflow-hidden bg-surface/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] group">
            {/* Spinning Vinyl */}
            <div className="relative size-32 mb-6 group-hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-900 to-black rounded-full shadow-2xl animate-[vinyl-spin_4s_linear_infinite]" style={{ animationDirection: 'reverse' }}>
                 <div className="absolute inset-2 border border-white/5 rounded-full" />
                 <div className="absolute inset-4 border border-white/5 rounded-full" />
                 <div className="absolute inset-6 border border-white/5 rounded-full" />
                 <div className="absolute inset-8 border border-white/5 rounded-full" />
                 <div className="absolute inset-10 bg-gradient-to-bl from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-inner">
                   <div className="size-3 bg-black rounded-full border border-white/20" />
                 </div>
              </div>
            </div>
            
            <p className="text-fg font-medium mb-2 text-lg">No top artists yet</p>
            <p className="text-muted text-sm max-w-[220px] mb-6">Artists you listen to the most will appear here over time.</p>
            <Link to="/explore">
              <button className="px-6 py-2.5 bg-surface border border-white/10 text-white rounded-full font-medium hover:bg-white/5 transition-all">
                Search for artists
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
