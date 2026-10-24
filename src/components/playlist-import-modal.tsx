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
import { Check, Download, ExternalLink, Loader2, Music, Sparkles, X } from "lucide-react";

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
    setUnmatchedCount(0);
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

      // Automatically start matching
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

  const handleFinalImport = () => {
    if (!matchedTracks.length) {
      toast.error("No tracks to import");
      return;
    }

    const title = playlistName.trim() || "Imported Playlist";
    const id = createPlaylist(title, matchedTracks);
    toast.success(`Imported "${title}" with ${matchedTracks.length} tracks!`);
    onOpenChange(false);
    reset();
    onImportComplete?.(id);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto bg-zinc-950/95 border-white/10 text-white backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-accent" />
            <DialogTitle className="text-lg font-bold text-white">
              1-Tap Playlist Importer
            </DialogTitle>
          </div>
          <DialogClose className="grid size-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors">
            <X className="size-4" />
          </DialogClose>
        </div>
        <DialogDescription className="text-white/60 text-xs mt-1">
          Instantly migrate your playlists from Spotify, Apple Music, or text tracklists directly into Sonara.
        </DialogDescription>

        {parsedItems.length === 0 ? (
          <div className="space-y-4 pt-2">
            {/* Tab switch */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 text-xs font-semibold">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === "spotify" ? "bg-accent text-white shadow" : "text-white/60 hover:text-white"
                }`}
                onClick={() => setMode("spotify")}
              >
                Spotify Link
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === "text" ? "bg-accent text-white shadow" : "text-white/60 hover:text-white"
                }`}
                onClick={() => setMode("text")}
              >
                Text Tracklist / Apple Music
              </button>
            </div>

            {mode === "spotify" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80">Public Spotify Playlist or Album URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://open.spotify.com/playlist/..."
                      value={spotifyUrl}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSpotifyUrl(e.target.value)}
                      className="flex-1 h-10 rounded-xl px-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      disabled={isScanning}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") void handleScanSpotify();
                      }}
                    />
                    <Button
                      variant="solid"
                      className="shrink-0 bg-accent hover:bg-accent/90 text-white font-semibold px-4"
                      disabled={isScanning || !spotifyUrl.trim()}
                      onClick={handleScanSpotify}
                    >
                      {isScanning ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <ExternalLink className="size-4 mr-1.5" />}
                      Scan
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-white/40">
                  Tip: In Spotify, tap Share → Copy link to playlist, then paste it here. No login or API keys needed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80">Paste Tracklist or Song Names</label>
                  <textarea
                    rows={6}
                    placeholder="1. Espresso - Sabrina Carpenter&#10;2. BIRDS OF A FEATHER - Billie Eilish&#10;3. Blinding Lights by The Weeknd"
                    value={textList}
                    onChange={(e) => setTextList(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent resize-none font-mono text-xs"
                    disabled={isScanning}
                  />
                </div>
                <div className="flex justify-end">
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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="size-14 rounded-lg object-cover shadow" />
              ) : (
                <div className="size-14 rounded-lg bg-white/10 flex items-center justify-center">
                  <Music className="size-6 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPlaylistName(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-base font-bold text-white focus:outline-none focus:border-b focus:border-accent rounded-none h-auto"
                />
                <p className="text-xs text-white/50 mt-1">
                  {parsedItems.length} tracks detected • {matchedTracks.length} matched in Sonara
                  {unmatchedCount > 0 ? ` (${unmatchedCount} unmatched)` : ""}
                </p>
              </div>
            </div>

            {/* Progress bar if matching */}
            {isMatching ? (
              <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin text-accent" />
                    Matching audio streams...
                  </span>
                  <span className="font-mono">{matchProgress.done} / {matchProgress.total}</span>
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

            {/* Preview of matched tracks */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
              {matchedTracks.map((t, idx) => (
                <div
                  key={t.id + idx}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/40 font-mono w-5 text-right shrink-0">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{t.title}</p>
                      <p className="text-white/50 truncate text-[11px]">{t.artist}</p>
                    </div>
                  </div>
                  <Check className="size-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
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
                className="bg-accent hover:bg-accent/90 text-white font-semibold"
                disabled={isMatching || matchedTracks.length === 0}
                onClick={handleFinalImport}
              >
                <Download className="size-4 mr-1.5" />
                Save to My Library ({matchedTracks.length} tracks)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
