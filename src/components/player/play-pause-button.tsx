import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlayPauseButton({ 
  isPlaying, 
  onClick, 
  className,
  iconClassName 
}: { 
  isPlaying: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      aria-label={isPlaying ? "Pause" : "Play"}
      className={cn("relative flex items-center justify-center transition-transform active:scale-90", className)}
      onClick={onClick}
    >
      <div className={cn("absolute transition-all duration-300 ease-in-out origin-center", isPlaying ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0")}>
        <Play className={cn("fill-current ml-0.5", iconClassName)} />
      </div>
      <div className={cn("absolute transition-all duration-300 ease-in-out origin-center", !isPlaying ? "opacity-0 scale-50 -rotate-90" : "opacity-100 scale-100 rotate-0")}>
        <Pause className={cn("fill-current", iconClassName)} />
      </div>
      {/* Invisible placeholder to maintain size */}
      <div className="opacity-0 pointer-events-none">
        <Play className={iconClassName} />
      </div>
    </button>
  );
}
