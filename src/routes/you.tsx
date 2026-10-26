import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Heart, History, ListMusic, LogOut, Mic2, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AlbumCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { Rail } from "@/components/rail";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { signOut, updateProfile } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LIKED_PLAYLIST_ID, usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";

export const Route = createFileRoute("/you")({
  head: () => ({ meta: [{ title: "Your profile · Sonara" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isPending } = useCurrentUserState();
  const likedCount = usePlayer((s) => s.likedIds.length);
  const playlistCount = usePlayer((s) => s.playlists.filter((p) => p.id !== LIKED_PLAYLIST_ID).length);
  const recents = usePlayer((s) => s.recents);
  const unsynced = usePlayer((s) => s.pendingChanges.length);
  const topArtists = useMemo(() => mostPlayedArtists(recents), [recents]);
  const [editing, setEditing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-4 pt-24">
        <div className="skeleton size-28 rounded-full" />
        <div className="skeleton h-6 w-40 rounded" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" search={{ redirect: "/you" }} replace />;

  const name = user.displayName || user.email?.split("@")[0] || "Listener";

  return (
    <div className="space-y-12 px-4 pt-6 pb-16 sm:px-6 short:space-y-8 desk:px-10 desk:pt-10">
      <section className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:text-left short:flex-row short:text-left">
        <Cover
          src={user.avatarUrl}
          alt={name}
          title={name}
          rounded="full"
          className="size-32 shrink-0 border-4 border-surface shadow-pop md:size-40 short:size-24"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-subtle uppercase">Profile</p>
          <h1 className="mt-1 truncate text-4xl font-bold tracking-tight md:text-5xl short:text-3xl">{name}</h1>
          <p className="mt-2 text-sm text-muted">
            {user.email}
            {user.memberSince && ` · Listening since ${user.memberSince.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-subtle">
            {unsynced ? (
              <>
                <RefreshCw className="size-3.5 text-warn" /> {unsynced} change{unsynced === 1 ? "" : "s"} waiting to sync
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-ok" /> Library synced to your account
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="chip" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit name
          </Button>
          <Button variant="chip" asChild>
            <Link to="/studio">
              <Mic2 className="size-4" /> Artist Studio
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="text-danger hover:bg-danger/10"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              signOut().catch((err: unknown) => {
                setSigningOut(false);
                toast.error(err instanceof Error ? err.message : "Couldn't sign out.");
              });
            }}
          >
            <LogOut className="size-4" /> {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 sm:max-w-xl">
        <Stat icon={Heart} value={likedCount} label="Liked songs" to="favorites" />
        <Stat icon={ListMusic} value={playlistCount} label="Playlists" to="playlists" />
        <Stat icon={History} value={recents.length} label="Recently played" to="recents" />
      </section>

      {topArtists.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Your top artists lately</h2>
          <div className="shelf">
            {topArtists.map(({ track, plays }) => (
              <Link
                key={track.artist}
                to={track.artistId ? "/artist/$id" : "/search"}
                params={track.artistId ? { id: track.artistId } : undefined}
                search={track.artistId ? undefined : { q: track.artist }}
                className="tv-card group flex w-28 shrink-0 flex-col items-center rounded-2xl text-center sm:w-32"
              >
                <Cover src={track.artwork} alt={track.artist} title={track.artist} rounded="full" className="aspect-square w-full border border-border" />
                <span className="mt-2 w-full truncate text-[13px] font-medium group-hover:text-accent">{track.artist}</span>
                <span className="text-xs text-subtle">{plays} song{plays === 1 ? "" : "s"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Rail title="Recently played">
        {recents.slice(0, 20).map((track) => (
          <AlbumCard key={track.id} track={track} queue={recents} />
        ))}
      </Rail>

      {recents.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="font-medium">Nothing played yet</p>
          <p className="mt-1 text-sm text-muted">Songs you play on any device will show up here.</p>
          <Button variant="accent" className="mt-5" asChild>
            <Link to="/explore">Find something to play</Link>
          </Button>
        </div>
      )}

      <EditNameDialog open={editing} onOpenChange={setEditing} initialName={user.displayName ?? ""} />
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  to,
}: {
  icon: typeof Heart;
  value: number;
  label: string;
  to: "favorites" | "playlists" | "recents";
}) {
  return (
    <Link
      to="/library"
      search={{ tab: to }}
      className="rounded-2xl border border-border bg-surface p-4 transition hover:border-border-strong hover:bg-surface-2"
    >
      <Icon className="size-4 text-accent" />
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Link>
  );
}

function EditNameDialog({
  open,
  onOpenChange,
  initialName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setName(initialName);
        onOpenChange(next);
      }}
    >
      <DialogContent title="Edit your name">
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            try {
              await updateProfile({ name: name.trim() });
              toast.success("Name updated");
              onOpenChange(false);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Couldn't save.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={saving || !name.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function mostPlayedArtists(tracks: Track[]): Array<{ track: Track; plays: number }> {
  const byArtist = new Map<string, { track: Track; plays: number }>();
  for (const track of tracks) {
    if (!track.artist || track.kind === "radio") continue;
    const key = track.artist.toLowerCase();
    const entry = byArtist.get(key);
    if (entry) entry.plays += 1;
    else byArtist.set(key, { track, plays: 1 });
  }
  return [...byArtist.values()].sort((a, b) => b.plays - a.plays).slice(0, 10);
}
