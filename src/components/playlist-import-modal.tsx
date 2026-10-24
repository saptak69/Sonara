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
  Check,
  CheckCircle2,
  Circle,
  ClipboardPaste,
  ExternalLink,
  Loader2,
  Music,
  Sparkles,
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
      toast.success(`Found ${res.tracks.length} tracks in "${res.name}"`);

      await startMatching(res.tracks);
    } catch (e: any) {
      toast.error(e?.message || "Error reading Spotify playlist");
    } finally {
      setIsScanning(false);
    }
  };

  const handleParseText = async () => {
    if (!textList.trim()) {
      toast.error("Please paste track names or lines");
      return;
    }

    const items = parseTextTracklist(textList);
    if (!items.length) {
      toast.error("Could not parse any tracks from the text");
      return;
    }

    setPlaylistName(`Imported Playlist • ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`);
    setCoverUrl(null);
    setParsedItems(items);
    toast.success(`Parsed ${items.length} track items`);

    await startMatching(items);
  };

  const startMatching = async (items: RawImportItem[]) => {
    setIsMatching(true);
    setMatchProgress({ done: 0, total: items.length });

    try {
      const { matched, unmatched } = await matchImportedTracks(items, (done, total) => {
        setMatchProgress({ done, total });
      });

      setMatchedTracks(matched);
      setSelectedIds(new Set(matched.map((t) => t.id)));
      setUnmatchedCount(unmatched.length);

      if (matched.length > 0) {
        toast.success(`Matched ${matched.length} of ${items.length} tracks with Sonara catalog!`);
      } else {
        toast.error("Could not find matching streams for these tracks in catalog.");
      }
    } catch {
      toast.error("An error occurred during track matching.");
    } finally {
      setIsMatching(false);
    }
  };

  const toggleTrackSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
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
      toast.error("Please select at least one track to import");
      return;
    }

    const title = playlistName.trim() || "Imported Playlist";
    const id = createPlaylist(title, finalTracks);
    toast.success(`Imported "${title}" with ${finalTracks.length} tracks!`);
    onOpenChange(false);
    reset();
    onImportComplete?.(id);
  };

  const selectedCount = selectedIds.size;
  const matchRate = parsedItems.length > 0 ? Math.round((matchedTracks.length / parsedItems.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto bg-zinc-950/95 border-white/10 text-white backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 grid place-items-center text-emerald-400">
              <Sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                1-Tap Playlist Importer
              </DialogTitle>
              <DialogDescription className="text-white/50 text-xs">
                Migrate Spotify, Apple Music, and text tracklists into Sonara
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="grid size-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors">
            <X className="size-4" />
          </DialogClose>
        </div>

        {parsedItems.length === 0 ? (
          <div className="space-y-4 pt-2">
            {/* Tab switch */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 text-xs font-semibold">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === "spotify" ? "bg-emerald-500 text-black font-bold shadow-md" : "text-white/60 hover:text-white"
                }`}
                onClick={() => setMode("spotify")}
              >
                <span>Spotify Link</span>
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === "text" ? "bg-accent text-white font-bold shadow-md" : "text-white/60 hover:text-white"
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
                    <label className="text-xs font-semibold text-white/80">Spotify Playlist or Album URL</label>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
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
                      className="flex-1 h-11 rounded-xl px-3.5 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans"
                      disabled={isScanning}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") void handleScanSpotify();
                      }}
                    />
                    <Button
                      variant="solid"
                      className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 h-11 rounded-xl"
                      disabled={isScanning || !spotifyUrl.trim()}
                      onClick={handleScanSpotify}
                    >
                      {isScanning ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <ExternalLink className="size-4 mr-1.5" />}
                      Scan
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 text-[11px] text-white/50">
                  <p className="font-semibold text-white/80 flex items-center gap-1">
                    <Check className="size-3 text-emerald-400" /> Instant migration without login:
                  </p>
                  <p>In Spotify, tap <strong>Share → Copy link to playlist</strong>, paste it above, and Sonara will resolve every track to high-bitrate master audio.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80">Paste Tracklist or Song Names</label>
                  <textarea
                    rows={6}
                    placeholder="1. Espresso - Sabrina Carpenter&#10;2. BIRDS OF A FEATHER by Billie Eilish&#10;3. Blinding Lights - The Weeknd"
                    value={textList}
                    onChange={(e) => setTextList(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3.5 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent resize-none font-mono text-xs"
                    disabled={isScanning}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/40">
                    Supports text copied from Apple Music, YouTube Music, or text notes
                  </span>
                  <Button
                    variant="solid"
                    className="bg-accent hover:bg-accent/90 text-white font-semibold"
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
          <div className="space-y-4 pt-2">
            {/* Header with parsed info */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="size-16 rounded-xl object-cover shadow-md shrink-0" />
              ) : (
                <div className="size-16 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Music className="size-7 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPlaylistName(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-base font-bold text-white focus:outline-none focus:border-b focus:border-accent rounded-none h-auto"
                />
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-white/60">
                    {parsedItems.length} found · {matchedTracks.length} matched
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">
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
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin text-accent" />
                    Matching audio streams...
                  </span>
                  <span className="font-mono text-white/90">{matchProgress.done} / {matchProgress.total}</span>
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
            <div className="flex items-center justify-between text-xs text-white/60 px-1 pt-1">
              <span>Select songs to import ({selectedCount} of {matchedTracks.length})</span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-accent hover:underline font-medium text-xs"
              >
                {selectedIds.size === matchedTracks.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* Preview of matched tracks */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
              {matchedTracks.map((t, idx) => {
                const selected = selectedIds.has(t.id);
                return (
                  <div
                    key={t.id + idx}
                    onClick={() => toggleTrackSelection(t.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 p-2.5 rounded-xl text-xs cursor-pointer transition-all border",
                      selected
                        ? "bg-white/[0.06] border-white/10 text-white"
                        : "bg-white/[0.02] border-transparent text-white/40 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0">
                        {selected ? (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        ) : (
                          <Circle className="size-4 text-white/20" />
                        )}
                      </span>
                      <span className="text-white/40 font-mono w-5 text-right shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className={cn("font-semibold truncate", selected ? "text-white" : "text-white/50")}>
                          {t.title}
                        </p>
                        <p className="text-white/50 truncate text-[11px]">{t.artist}</p>
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
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white text-xs"
                onClick={reset}
                disabled={isMatching}
              >
                Start Over
              </Button>
              <Button
                variant="solid"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg"
                disabled={isMatching || selectedCount === 0}
                onClick={handleFinalImport}
              >
                <ListPlus className="size-4 mr-1.5" />
                Import {selectedCount} tracks to Library
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
