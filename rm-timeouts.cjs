const fs = require('fs');

// Fix app-shell.tsx
let appShell = fs.readFileSync('src/components/app-shell.tsx', 'utf8');
appShell = appShell.replace(/setTimeout\(\(\) => \{\s*mobileSearchInputRef\.current\?\.focus\(\);\s*\}, 60\);/g, 'mobileSearchInputRef.current?.focus();');
fs.writeFileSync('src/components/app-shell.tsx', appShell);

// Fix bar.tsx
let bar = fs.readFileSync('src/components/player/bar.tsx', 'utf8');
bar = bar.replace(/setTimeout\(\(\) => setLyricsOpen\(true\), 50\);/g, 'setLyricsOpen(true);');
bar = bar.replace(/setTimeout\(\(\) => setLyricsOpen\(false\), 50\);/g, 'setLyricsOpen(false);');
fs.writeFileSync('src/components/player/bar.tsx', bar);
