import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";
import {
  parseSpotifyUrlServerFn,
  parseTextTracklist,
  matchImportedTracks,
  type RawImportItem,
} from "@/lib/playlist-importer";
import type { Track } from "@/lib/types";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  ClipboardPaste,
  Loader2,
  Music,
  Search,
  X,
  ListPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PlaylistImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (playlistId: string) => void;
}) {
  const createPlaylist = usePlayer((s) => s.createPlaylist);

  const [mode, setMode] = useState<"spotify" | "text">("spotify");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [textList, setTextList] = useState("");

  const [isScanning, setIsScanning] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState({ done: 0, total: 0 });

  const [playlistName, setPlaylistName] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<RawImportItem[]>([]);
  const [matchedTracks, setMatchedTracks] = useState<Track[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [unmatchedCount, setUnmatchedCount] = useState(0);

  const reset = () => {
    setSpotifyUrl("");
    setTextList("");
    setIsScanning(false);
    setIsMatching(false);
    setMatchProgress({ done: 0, total: 0 });
    setPlaylistName("");
    setCoverUrl(null);
    setParsedItems([]);
    setMatchedTracks([]);
    setSelectedIds(new Set());
    setUnmatchedCount(0);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setSpotifyUrl(text.trim());
          toast.success("Pasted URL from clipboard");
        } else {
          toast.error("Clipboard is empty");
        }
      } else {
        toast.error("Clipboard access not available in this browser");
      }
    } catch {
      toast.error("Could not read from clipboard. Please paste manually.");
    }
  };

  const handleScanSpotify = async () => {
    if (!spotifyUrl.trim()) {
      toast.error("Please enter a Spotify playlist or album URL");
      return;
    }

    setIsScanning(true);
    try {
      const res = await parseSpotifyUrlServerFn({ data: { url: spotifyUrl.trim() } });
      if (!res.ok) {
        toast.error(res.error || "Failed to parse Spotify link");
        setIsScanning(false);
        return;
      }

      setPlaylistName(res.name);
      setCoverUrl(res.coverUrl);
      setParsedItems(res.tracks);
      setIsScanning(false);

      void runMatching(res.tracks);
    } catch (err) {
      console.error(err);
      toast.error("Network error while scanning playlist");
      setIsScanning(false);
    }
  };

  const handleParseText = () => {
    if (!textList.trim()) {
      toast.error("Please enter some tracks");
      return;
    }
    const items = parseTextTracklist(textList);
    if (!items.length) {
      toast.error("Could not parse any track names from the text");
      return;
    }
    setPlaylistName(`Imported List • ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`);
    setCoverUrl(null);
    setParsedItems(items);
    void runMatching(items);
  };

  const runMatching = async (items: RawImportItem[]) => {
    setIsMatching(true);
    setMatchProgress({ done: 0, total: items.length });

    try {
      const { matched, unmatched } = await matchImportedTracks(items, (done, total) => {
        setMatchProgress({ done, total });
      });

      setMatchedTracks(matched);
      setUnmatchedCount(unmatched.length);
      setSelectedIds(new Set(matched.map((t) => t.id)));
      setIsMatching(false);

      if (matched.length === 0) {
        toast.error("No high-quality audio streams could be matched for these tracks");
      } else {
        toast.success(`Matched ${matched.length} of ${items.length} tracks!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error matching tracks");
      setIsMatching(false);
    }
  };

  const toggleTrackSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === matchedTracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(matchedTracks.map((t) => t.id)));
    }
  };

  const handleFinalImport = () => {
    const finalTracks = matchedTracks.filter((t) => selectedIds.has(t.id));
    if (!finalTracks.length) {
      toast.error("Please select at least 1 track to import");
      return;
    }

    const playlistId = createPlaylist(playlistName.trim() || "Imported Playlist", finalTracks);
    toast.success(`Imported "${playlistName}" (${finalTracks.length} tracks) to your Library!`);
    onOpenChange(false);
    if (onImportComplete) {
      onImportComplete(playlistId);
    }
    reset();
  };

  const selectedCount = selectedIds.size;
  const matchRate = parsedItems.length > 0 ? Math.round((matchedTracks.length / parsedItems.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-white/[0.08] text-white rounded-2xl p-6 shadow-2xl [scrollbar-width:thin]">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-surface -mx-6 -mt-6 p-6 pb-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-white/[0.06] border border-white/[0.08] grid place-items-center text-accent">
              <ListPlus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-white">
                Import Playlist
              </DialogTitle>
              <DialogDescription className="text-white/50 text-xs">
                Migrate Spotify, Apple Music, and text tracklists into Sonara
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="grid size-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <X className="size-4" />
          </DialogClose>
        </div>

        {parsedItems.length === 0 ? (
          <div className="space-y-4 pt-4">
            {/* Tab switch */}
            <div className="flex bg-surface-2 p-1 rounded-xl border border-white/[0.06] text-xs font-medium">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "spotify" ? "bg-surface-3 text-white font-semibold shadow-sm" : "text-white/60 hover:text-white"
                }`}
                onClick={() => setMode("spotify")}
              >
                <span>Spotify Link</span>
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "text" ? "bg-surface-3 text-white font-semibold shadow-sm" : "text-white/60 hover:text-white"
                }`}
                onClick={() => setMode("text")}
              >
                <span>Apple Music / Text List</span>
              </button>
            </div>

            {mode === "spotify" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white/70">Spotify Playlist or Album URL</label>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-[11px] text-white/60 hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      <ClipboardPaste className="size-3" />
                      Paste from clipboard
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://open.spotify.com/playlist/..."
                      value={spotifyUrl}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSpotifyUrl(e.target.value)}
                      className="flex-1 h-11 rounded-xl px-3.5 text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 font-sans"
                      disabled={isScanning}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") void handleScanSpotify();
                      }}
                    />
                    <Button
                      variant="solid"
                      className="shrink-0 bg-white text-black hover:bg-white/90 font-semibold px-5 h-11 rounded-xl cursor-pointer"
                      disabled={isScanning || !spotifyUrl.trim()}
                      onClick={handleScanSpotify}
                    >
                      {isScanning ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Search className="size-4 mr-1.5" />}
                      Scan
                    </Button>
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-3 text-[11px] text-white/40 leading-relaxed space-y-1">
                  <p className="font-medium text-white/70">Instant migration without login:</p>
                  <p>In Spotify, tap <strong>Share → Copy link to playlist</strong>, paste it above, and Sonara will resolve every track into your Library.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70">Paste Tracklist or Song Names</label>
                  <textarea
                    rows={6}
                    placeholder="1. Espresso - Sabrina Carpenter&#10;2. BIRDS OF A FEATHER by Billie Eilish&#10;3. Blinding Lights - The Weeknd"
                    value={textList}
                    onChange={(e) => setTextList(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:border-white/30 resize-none font-mono text-xs"
                    disabled={isScanning}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/40">
                    Supports text copied from Apple Music, YouTube Music, or notes
                  </span>
                  <Button
                    variant="solid"
                    className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-10 px-5 text-xs cursor-pointer"
                    disabled={isScanning || !textList.trim()}
                    onClick={handleParseText}
                  >
                    Match & Import
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-3">
            {/* Header with parsed info */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="size-14 rounded-lg object-cover shadow-sm shrink-0" />
              ) : (
                <div className="size-14 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Music className="size-6 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPlaylistName(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-white focus:outline-none focus:border-b focus:border-white/20 rounded-none h-auto"
                />
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-white/50">
                    {parsedItems.length} found · {matchedTracks.length} matched
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/[0.06] text-white/80 px-2 py-0.5 rounded-full border border-white/10">
                    {matchRate}% match
                  </span>
                  {unmatchedCount > 0 ? (
                    <span className="text-[10px] text-white/40">({unmatchedCount} unmatched)</span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Progress bar if matching */}
            {isMatching ? (
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin text-accent" />
                    Matching audio streams...
                  </span>
                  <span className="font-mono text-white/80">{matchProgress.done} / {matchProgress.total}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-200"
                    style={{
                      width: `${matchProgress.total > 0 ? (matchProgress.done / matchProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            {/* Controls above list */}
            <div className="flex items-center justify-between text-xs text-white/60 px-0.5">
              <span>Select tracks ({selectedCount} of {matchedTracks.length})</span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-white/80 hover:text-white underline font-medium text-xs cursor-pointer"
              >
                {selectedIds.size === matchedTracks.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* Preview of matched tracks */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 [scrollbar-width:thin]">
              {matchedTracks.map((t, idx) => {
                const selected = selectedIds.has(t.id);
                return (
                  <div
                    key={t.id + idx}
                    onClick={() => toggleTrackSelection(t.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 p-2 rounded-lg text-xs cursor-pointer transition-all border",
                      selected
                        ? "bg-white/[0.05] border-white/[0.08] text-white"
                        : "bg-transparent border-transparent text-white/40 hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0">
                        {selected ? (
                          <CheckCircle2 className="size-4 text-ok" />
                        ) : (
                          <Circle className="size-4 text-white/30" />
                        )}
                      </span>
                      <span className="text-white/40 font-mono w-4 text-right shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className={cn("font-medium truncate", selected ? "text-white" : "text-white/50")}>
                          {t.title}
                        </p>
                        <p className="text-white/40 truncate text-[11px]">{t.artist}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-white/40 shrink-0">
                      {t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, "0")}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white text-xs cursor-pointer"
                onClick={reset}
                disabled={isMatching}
              >
                Start Over
              </Button>
              <Button
                variant="solid"
                className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl text-xs h-10 px-5 shadow-sm cursor-pointer"
                disabled={isMatching || selectedCount === 0}
                onClick={handleFinalImport}
              >
                <ListPlus className="size-4 mr-1.5" />
                Import {selectedCount} tracks
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
