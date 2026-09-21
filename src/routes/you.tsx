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
          <div className="bg-surface/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
            <PlayCircle className="size-8 text-muted mb-3 opacity-50" />
            <p className="text-fg font-medium mb-1">No recent activity</p>
            <p className="text-muted text-sm max-w-[200px]">Your recent listening history will appear here once you start playing music.</p>
            <Link to="/explore" className="mt-4 text-sm font-medium text-accent hover:underline">
              Discover new music
            </Link>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-fg">
            <Heart className="size-5 text-red-400" /> Top Artists
          </h3>
          <div className="bg-surface/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
            <User className="size-8 text-muted mb-3 opacity-50" />
            <p className="text-fg font-medium mb-1">No top artists yet</p>
            <p className="text-muted text-sm max-w-[200px]">Artists you listen to the most will appear here over time.</p>
            <Link to="/explore" className="mt-4 text-sm font-medium text-accent hover:underline">
              Search for artists
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
