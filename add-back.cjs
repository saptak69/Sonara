const fs = require('fs');
let content = fs.readFileSync('src/components/app-shell.tsx', 'utf8');

const backBtnCode = `
    const backBtnSub = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      // Close Modals/Player first
      const state = usePlayer.getState();
      if (state.fullPlayerOpen) {
        state.setFullPlayerOpen(false);
        return;
      }
      if (state.queuePanelOpen) {
        state.setQueuePanelOpen(false);
        return;
      }
      if (state.lyricsOpen) {
        state.setLyricsOpen(false);
        return;
      }
      if (mobileSearchOpen) {
        setMobileSearchOpen(false);
        return;
      }
      // If none of the overlays are open, use native back behavior
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });
`;

content = content.replace(
  '    return () => {\n      window.removeEventListener("keydown", handleGlobalKeyDown);',
  backBtnCode + '\n    return () => {\n      window.removeEventListener("keydown", handleGlobalKeyDown);\n      backBtnSub.then(s => s.remove());'
);

fs.writeFileSync('src/components/app-shell.tsx', content);
console.log('Done app-shell.tsx');
