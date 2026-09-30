import { useEffect, useState, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { toast } from "sonner";

export function UpdatePrompt() {
  const checkedRef = useRef(false);

  useEffect(() => {
    async function checkUpdate() {
      if (checkedRef.current) return;
      checkedRef.current = true;
      try {
        const platform = await CapacitorApp.getInfo().catch(() => null);
        if (!platform) return; // Not running in Capacitor

        const currentVersion = platform.version;
        if (!currentVersion) return;

        const res = await fetch("/api/version");
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.version && data.version !== currentVersion) {
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
            toast('Update Available (v' + data.version + ')', {
              description: data.releaseNotes || 'Tap to download and install.',
              action: {
                label: 'Update',
                onClick: () => {
                  Browser.open({ url: data.downloadUrl });
                }
              },
              duration: 10000,
            });
          }
        }
      } catch (error) {
        console.error("Failed to check for update", error);
      }
    }

    checkUpdate();
  }, []);

  return null;
}
