import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function UpdatePrompt() {
  const [open, setOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; downloadUrl: string; releaseNotes: string } | null>(null);

  useEffect(() => {
    async function checkUpdate() {
      try {
        const platform = await CapacitorApp.getInfo().catch(() => null);
        if (!platform) return; // Not running in Capacitor

        const currentVersion = platform.version;
        if (!currentVersion) return;

        const res = await fetch("/api/version");
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.version && data.version !== currentVersion) {
          // Compare versions. A simple check for demo purposes. 
          // In real prod, use semver logic or string comparison
          const currentParts = currentVersion.split('.').map(Number);
          const newParts = data.version.split('.').map(Number);
          
          let isNewer = false;
          for (let i = 0; i < Math.max(currentParts.length, newParts.length); i++) {
            const cur = currentParts[i] || 0;
            const nw = newParts[i] || 0;
            if (nw > cur) {
              isNewer = true;
              break;
            } else if (nw < cur) {
              break;
            }
          }

          if (isNewer) {
            setUpdateInfo(data);
            setOpen(true);
          }
        }
      } catch (error) {
        console.error("Failed to check for update", error);
      }
    }

    checkUpdate();
  }, []);

  if (!updateInfo) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="Update Available">
        <div className="py-4 text-sm text-fg">
          <p className="mb-4">
            A new version of Sonara (v{updateInfo.version}) is available to download.
          </p>
          <p className="font-semibold mb-2">What's new:</p>
          <p className="text-muted">{updateInfo.releaseNotes}</p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>Later</Button>
          <Button 
            className="bg-accent text-white" 
            onClick={async () => {
              await Browser.open({ url: updateInfo.downloadUrl });
              setOpen(false);
            }}
          >
            Download Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
