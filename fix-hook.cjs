const fs = require('fs');
let code = fs.readFileSync('src/components/player/engine.tsx', 'utf8');

code = code.replace(/}, 1000\);\s*\/\/ Media Session & Lockscreen Controls/, 
'}, 1000);\n    return () => clearInterval(interval);\n  }, [isPlaying, current?.id]);\n\n  // Media Session & Lockscreen Controls');

fs.writeFileSync('src/components/player/engine.tsx', code);
console.log('Fixed');
