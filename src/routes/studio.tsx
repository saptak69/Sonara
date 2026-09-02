import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  type ArtistProfile,
  type UploadedTrack,
  deleteArtistTrackServerFn,
  getMyArtistTracksServerFn,
  getOrCreateArtistProfileServerFn,
  publishTrackServerFn,
  updateArtistProfileServerFn,
} from "@/lib/artist-studio";
import { usePlayer } from "@/lib/player-store";
import { Cover } from "@/components/cover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GENRES, MOODS } from "@/lib/genres";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Disc,
  Edit3,
  FileAudio,
  Headphones,
  Image as ImageIcon,
  Layers,
  Music,
  Pause,
  Play,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/studio")({
  component: ArtistStudioPage,
});

function ArtistStudioPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const playTrack = usePlayer((s) => s.playTrack);
  const currentTrack = usePlayer((s) => s.queue[s.index]);
  const isPlayerPlaying = usePlayer((s) => s.isPlaying);
  const togglePlay = usePlayer((s) => s.toggle);

  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [tracks, setTracks] = useState<UploadedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit modal
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Upload track modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Lo-Fi");
  const [mood, setMood] = useState("Chill");
  const [description, setDescription] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioStorageKey, setAudioStorageKey] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioFileSize, setAudioFileSize] = useState(0);
  const [audioMimeType, setAudioMimeType] = useState("audio/mpeg");
  const [audioFileName, setAudioFileName] = useState("");
  const [coverArtUrl, setCoverArtUrl] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingArt, setUploadingArt] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Local audio preview deck
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const prof = await getOrCreateArtistProfileServerFn();
      setProfile(prof);
      setDisplayName(prof.displayName);
      setHandle(prof.handle);
      setBio(prof.bio || "");
      setAvatarUrl(prof.avatarUrl || "");

      const myTracks = await getMyArtistTracksServerFn();
      setTracks(myTracks);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load studio data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && user) {
      void loadData();
    }
  }, [user, isPending]);

  // Handle audio file upload to first-party storage endpoint
  const handleAudioUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side format & size
    if (!file.name.match(/\.(mp3|wav|aac|m4a|ogg|flac)$/i)) {
      toast.error("Please select a valid audio file (MP3, WAV, AAC, M4A, FLAC).");
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      toast.error("Audio file exceeds 60MB limit.");
      return;
    }

    setUploadingAudio(true);
    setAudioFileName(file.name);

    // Read audio duration client-side
    const audioObj = document.createElement("audio");
    audioObj.src = URL.createObjectURL(file);
    audioObj.onloadedmetadata = () => {
      setAudioDuration(audioObj.duration || 0);
    };

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "audio");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Upload failed");
      }

      setAudioUrl(data.url);
      setAudioStorageKey(data.storageKey);
      setAudioFileSize(data.fileSize);
      setAudioMimeType(data.mimeType);
      toast.success("Audio file uploaded successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload audio file.";
      toast.error(msg);
      setAudioFileName("");
    } finally {
      setUploadingAudio(false);
    }
  };

  // Handle artwork image upload to first-party storage endpoint
  const handleArtworkUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(jpe?g|png|webp|avif)$/i)) {
      toast.error("Please select a valid image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file exceeds 10MB limit.");
      return;
    }

    setUploadingArt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "artwork");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Upload failed");
      }

      setCoverArtUrl(data.url);
      toast.success("Artwork uploaded successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload artwork.";
      toast.error(msg);
    } finally {
      setUploadingArt(false);
    }
  };

  const handlePublish = async (e: FormEvent, status: "published" | "draft") => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a track title.");
      return;
    }
    if (!audioUrl || !audioStorageKey) {
      toast.error("Please upload an audio recording.");
      return;
    }
    if (!rightsConfirmed) {
      toast.error("You must confirm you hold all rights to this recording.");
      return;
    }

    setPublishing(true);
    try {
      await publishTrackServerFn({
        data: {
          title: title.trim(),
          genre,
          mood,
          description: description.trim() || undefined,
          lyrics: lyrics.trim() || undefined,
          coverArtUrl: coverArtUrl || undefined,
          audioUrl,
          storageKey: audioStorageKey,
          duration: audioDuration,
          fileSize: audioFileSize,
          mimeType: audioMimeType,
          status,
          rightsConfirmed,
        },
      });

      toast.success(
        status === "published"
          ? "Single published to Sonara! It is now live in discovery."
          : "Track saved to your drafts.",
      );

      // Reset form & reload
      setTitle("");
      setDescription("");
      setLyrics("");
      setAudioUrl("");
      setAudioStorageKey("");
      setCoverArtUrl("");
      setAudioFileName("");
      setRightsConfirmed(false);
      setUploadModalOpen(false);
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish track.";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateArtistProfileServerFn({
        data: {
          displayName: displayName.trim(),
          handle: handle.trim().toLowerCase(),
          bio: bio.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        },
      });
      toast.success("Artist profile updated!");
      setEditProfileOpen(false);
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDelete = async (trackId: string, trackTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${trackTitle}"?`)) return;
    try {
      await deleteArtistTrackServerFn({ data: { trackId } });
      toast.success("Track deleted.");
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete track";
      toast.error(msg);
    }
  };

  // Signed out state
  if (!isPending && !user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-black/55 backdrop-blur-3xl border border-white/15 p-8 text-center shadow-2xl">
          <div className="grid size-16 place-items-center rounded-2xl bg-accent/20 border border-accent/30 mx-auto mb-4 text-accent">
            <Disc className="size-8 animate-spin-slow" />
          </div>
          <h1 className="text-xl font-bold text-fg mb-2">Sonara Artist Studio</h1>
          <p className="text-xs sm:text-sm text-muted mb-6">
            Upload your original songs, reach listeners worldwide, and view your streaming analytics.
          </p>
          <Button
            onClick={() => void navigate({ to: "/login" })}
            className="w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium"
          >
            Sign In or Create Account
          </Button>
        </div>
      </div>
    );
  }

  const totalPlays = tracks.reduce((acc, t) => acc + (t.playCount || 0), 0);
  const publishedTracks = tracks.filter((t) => t.status === "published");
  const draftTracks = tracks.filter((t) => t.status === "draft");

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-8">
      {/* Studio Header Card */}
      <div className="rounded-3xl bg-black/45 backdrop-blur-3xl border border-white/15 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Cover
              src={profile?.avatarUrl || user?.profileImageUrl}
              alt={profile?.displayName || "Artist"}
              title={profile?.displayName || "Artist"}
              rounded="full"
              className="size-16 sm:size-20 border-2 border-white/20 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-fg">
                  {profile?.displayName || user?.displayName || "Independent Artist"}
                </h1>
                {profile?.verified && (
                  <span title="Verified Artist">
                    <CheckCircle2 className="size-5 text-accent fill-accent/20" />
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted">@{profile?.handle || "artist"}</p>
              {profile?.bio && <p className="text-xs text-muted/80 mt-1 max-w-md">{profile.bio}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Share Profile Button */}
            <Button
              variant="ghost"
              className="flex-1 sm:flex-none rounded-xl gap-2 text-xs border border-white/15 bg-white/5 hover:bg-white/10"
              onClick={() => {
                const url = window.location.origin + (profile?.id ? `/artist/${profile.id}` : "/studio");
                if (navigator.clipboard) {
                  void navigator.clipboard.writeText(url);
                  toast.success("Artist profile link copied to clipboard!");
                }
              }}
            >
              <Share2 className="size-3.5" />
              Share Profile
            </Button>

            {/* Edit Profile Dialog */}
            <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="flex-1 sm:flex-none rounded-xl gap-2 text-xs border border-white/15 bg-white/5 hover:bg-white/10">
                  <Edit3 className="size-3.5" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent title="Edit Artist Profile">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Artist Display Name
                    </label>
                    <input
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Artist Handle (@)
                    </label>
                    <input
                      required
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Avatar URL
                    </label>
                    <input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Artist Bio
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell listeners about your music and story..."
                      className="w-full rounded-xl bg-black/60 p-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20 resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full rounded-xl bg-accent text-white"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Upload Track Dialog */}
            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none rounded-xl gap-2 text-xs bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20">
                  <Plus className="size-4" />
                  Upload Single
                </Button>
              </DialogTrigger>
              <DialogContent title="Upload Single to Sonara" className="max-w-xl max-h-[90vh] overflow-y-auto">
                <form className="space-y-4 pt-2">
                  {/* Track Title */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Song Title *
                    </label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Midnight Reverie"
                      className="h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
                    />
                  </div>

                  {/* Genre & Mood Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Genre</label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
                      >
                        {GENRES.map((g) => (
                          <option key={g.slug} value={g.label} className="bg-neutral-900 text-fg">
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Mood</label>
                      <select
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        className="h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
                      >
                        {MOODS.map((m) => (
                          <option key={m.id} value={m.label} className="bg-neutral-900 text-fg">
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Audio Upload File Area */}
                  <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-center">
                    <FileAudio className="size-8 mx-auto text-accent mb-2" />
                    <p className="text-xs font-medium text-fg mb-1">
                      {audioFileName ? audioFileName : "Select Audio Recording (MP3, WAV, AAC, M4A)"}
                    </p>
                    <p className="text-[11px] text-muted mb-3">Max file size: 60MB</p>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-fg cursor-pointer transition-colors">
                      <Upload className="size-3.5" />
                      {uploadingAudio ? "Uploading to Storage..." : "Choose Audio File"}
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.aac,.m4a,.flac"
                        onChange={handleAudioUpload}
                        disabled={uploadingAudio}
                        className="hidden"
                      />
                    </label>

                    {/* Audio Preview Player */}
                    {audioUrl && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-accent">
                          <CheckCircle2 className="size-4" />
                          <span>Ready for release ({Math.round(audioDuration)}s)</span>
                        </div>
                        <audio ref={previewAudioRef} src={audioUrl} />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            if (!previewAudioRef.current) return;
                            if (previewPlaying) {
                              previewAudioRef.current.pause();
                              setPreviewPlaying(false);
                            } else {
                              void previewAudioRef.current.play();
                              setPreviewPlaying(true);
                            }
                          }}
                          className="h-8 px-2.5 rounded-lg text-xs gap-1.5"
                        >
                          {previewPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                          Audition
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Artwork Upload Area */}
                  <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-center">
                    {coverArtUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={coverArtUrl}
                          alt="Cover"
                          className="size-14 rounded-xl object-cover border border-white/15"
                        />
                        <div className="text-left flex-1">
                          <p className="text-xs font-medium text-fg">Artwork Loaded</p>
                          <label className="text-[11px] text-accent cursor-pointer hover:underline">
                            Change artwork
                            <input
                              type="file"
                              accept="image/*,.jpg,.jpeg,.png,.webp"
                              onChange={handleArtworkUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="size-8 mx-auto text-accent mb-2" />
                        <p className="text-xs font-medium text-fg mb-1">
                          Upload Album Artwork (JPG, PNG, WebP)
                        </p>
                        <p className="text-[11px] text-muted mb-3">Square aspect ratio recommended</p>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-fg cursor-pointer transition-colors">
                          <Upload className="size-3.5" />
                          {uploadingArt ? "Uploading..." : "Choose Artwork"}
                          <input
                            type="file"
                            accept="image/*,.jpg,.jpeg,.png,.webp"
                            onChange={handleArtworkUpload}
                            disabled={uploadingArt}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {/* Description & Lyrics */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Track Description / Liner Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Story behind the track..."
                      className="w-full rounded-xl bg-black/60 p-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Lyrics (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      placeholder="Enter lyrics for the full player view..."
                      className="w-full rounded-xl bg-black/60 p-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20 resize-none"
                    />
                  </div>

                  {/* Rights & Ownership Confirmation */}
                  <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rightsConfirmed}
                        onChange={(e) => setRightsConfirmed(e.target.checked)}
                        className="mt-0.5 size-4 rounded accent-accent"
                      />
                      <span className="text-xs text-muted leading-relaxed">
                        I declare that I own or control 100% of the copyright in this audio recording and artwork, and authorize Sonara to host and stream it to listeners worldwide.
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={publishing || uploadingAudio}
                      onClick={(e) => void handlePublish(e, "draft")}
                      className="flex-1 rounded-xl text-xs border border-white/15 bg-white/5 hover:bg-white/10"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      disabled={publishing || uploadingAudio || !audioUrl || !rightsConfirmed}
                      onClick={(e) => void handlePublish(e, "published")}
                      className="flex-1 rounded-xl text-xs bg-accent hover:bg-accent/90 text-white font-medium shadow-lg shadow-accent/20"
                    >
                      {publishing ? "Publishing..." : "Publish Single"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 p-5 shadow-lg flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-accent/15 text-accent border border-accent/20">
            <Headphones className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Total Verified Plays</p>
            <p className="text-2xl font-bold text-fg mt-0.5">{totalPlays.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 p-5 shadow-lg flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
            <Disc className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Published Singles</p>
            <p className="text-2xl font-bold text-fg mt-0.5">{publishedTracks.length}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 p-5 shadow-lg flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Layers className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Draft Recordings</p>
            <p className="text-2xl font-bold text-fg mt-0.5">{draftTracks.length}</p>
          </div>
        </div>
      </div>

      {/* Catalog Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-fg">Your Music Discography</h2>
            <p className="text-xs text-muted">Manage your releases, audio assets, and stream counts</p>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 p-12 text-center">
            <Music className="size-12 mx-auto text-muted/50 mb-3" />
            <h3 className="text-base font-semibold text-fg mb-1">No songs uploaded yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mb-4">
              Click &quot;Upload Single&quot; above to upload your first original recording to Sonara.
            </p>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="rounded-xl bg-accent hover:bg-accent/90 text-white text-xs gap-2"
            >
              <Plus className="size-4" />
              Upload Your First Song
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-muted bg-white/5">
                    <th className="py-3.5 px-4">Track</th>
                    <th className="py-3.5 px-4">Genre / Mood</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Streams</th>
                    <th className="py-3.5 px-4">Released</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-fg">
                  {tracks.map((t) => {
                    const isCurrent = currentTrack?.id === t.id;
                    const isPlaying = isCurrent && isPlayerPlaying;

                    return (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative group size-10 shrink-0">
                              <Cover
                                src={t.coverArtUrl}
                                alt={t.title}
                                title={t.title}
                                className="size-10 rounded-lg object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCurrent) {
                                    togglePlay();
                                  } else {
                                    playTrack({
                                      id: t.id,
                                      title: t.title,
                                      artist: t.artistName || profile?.displayName || "Artist",
                                      artwork: t.coverArtUrl,
                                      artworkLg: t.coverArtUrl,
                                      streamUrl: t.audioUrl,
                                      genre: t.genre || undefined,
                                      duration: t.duration,
                                      kind: "track",
                                    });
                                  }
                                }}
                                className="absolute inset-0 grid place-items-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white"
                              >
                                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
                              </button>
                            </div>
                            <div>
                              <p className="font-semibold text-fg line-clamp-1">{t.title}</p>
                              <p className="text-[11px] text-muted line-clamp-1">
                                {t.artistName || profile?.displayName}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-muted">
                          {t.genre || "General"} {t.mood ? `• ${t.mood}` : ""}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              t.status === "published"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                : t.status === "draft"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                : "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                t.status === "published" ? "bg-emerald-400" : "bg-amber-400"
                              }`}
                            />
                            {t.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-medium text-fg">
                          {t.playCount.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-muted">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => void handleDelete(t.id, t.title)}
                            className="p-1.5 text-muted hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                            title="Delete Track"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
