const fs = require('fs');
let content = fs.readFileSync('src/components/player/engine.tsx', 'utf8');

const mediaSessionCode = `
  // Media Session & Lockscreen Controls
  useEffect(() => {
    if (!current?.id || !current?.title || typeof window === 'undefined') return;
    void import('@capgo/capacitor-media-session').then(({ MediaSession }) => {
      MediaSession.setMetadata({
        title: current.title,
        artist: current.artist || 'Unknown Artist',
        album: current.album || 'Unknown Album',
        artwork: current.artwork ? [{ src: current.artworkLg || current.artwork, sizes: '512x512', type: 'image/jpeg' }] : []
      }).catch(() => {});
      
      MediaSession.setActionHandler({ action: 'play' }, () => { setPlaying(true); });
      MediaSession.setActionHandler({ action: 'pause' }, () => { setPlaying(false); });
      MediaSession.setActionHandler({ action: 'nexttrack' }, () => { next(); });
      MediaSession.setActionHandler({ action: 'previoustrack' }, () => { prev(); });
      MediaSession.setActionHandler({ action: 'seekforward' }, () => { 
        const a = getActive();
        if(a) a.currentTime = Math.min(a.duration, a.currentTime + 10);
      });
      MediaSession.setActionHandler({ action: 'seekbackward' }, () => { 
        const a = getActive();
        if(a) a.currentTime = Math.max(0, a.currentTime - 10);
      });
    }).catch(() => {});
  }, [current?.id, current?.title, current?.artist, current?.album, current?.artwork, current?.artworkLg, next, prev, setPlaying]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    void import('@capgo/capacitor-media-session').then(({ MediaSession }) => {
      MediaSession.setPlaybackState({
        playbackState: isPlaying ? 'playing' : 'paused'
      }).catch(() => {});
    }).catch(() => {});
  }, [isPlaying, current?.id]);
`;

// Insert the code right before \`return (\`
content = content.replace('  return (', mediaSessionCode + '\n  return (');
fs.writeFileSync('src/components/player/engine.tsx', content);
console.log('Done engine.tsx');
