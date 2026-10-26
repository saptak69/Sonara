import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { usePlayer } from "@/lib/player-store";

export function CreatePlaylistDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createPlaylist = usePlayer((s) => s.createPlaylist);
  const navigate = useNavigate();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setName("");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="New playlist">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            const id = createPlaylist(trimmed);
            setOpen(false);
            setName("");
            void navigate({ to: "/playlist/$id", params: { id } });
          }}
        >
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-muted">Name</span>
            <input
              autoFocus
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="Late night drives"
              className="h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-fg outline-none transition placeholder:text-subtle focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
