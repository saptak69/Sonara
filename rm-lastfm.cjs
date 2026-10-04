const fs = require('fs');

function removeLastFM() {
    let bar = fs.readFileSync('src/components/player/bar.tsx', 'utf8');
    bar = bar.replace(/\s*const lastfmUsername = usePlayer\(\(s\) => s\.lastfmUsername\);\r?\n/, '');
    bar = bar.replace(/\s*\{lastfmUsername && isPlaying && \([\s\S]*?<\/span>\s*\)\}/g, '');
    fs.writeFileSync('src/components/player/bar.tsx', bar);

    let engine = fs.readFileSync('src/components/player/engine.tsx', 'utf8');
    engine = engine.replace(/import \{ scrobbleTrackServerFn \} from "@\/lib\/lastfm";\r?\n/, '');
    engine = engine.replace(/\s*const state = usePlayer\.getState\(\);\r?\n\s*const currentT = state\.current\(\);\r?\n\s*if \(currentT && state\.lastfmUsername\) \{[\s\S]*?\}\r?\n/g, '\n');
    fs.writeFileSync('src/components/player/engine.tsx', engine);

    let you = fs.readFileSync('src/routes/you.tsx', 'utf8');
    you = you.replace(/\s*const lastfmUsername = usePlayer\(\(s\) => s\.lastfmUsername\);\r?\n/, '');
    you = you.replace(/\s*const \[fmInput, setFmInput\] = useState\(lastfmUsername \|\| ""\);\r?\n/, '');
    // Need a broader regex to remove the Last.fm UI section
    you = you.replace(/\s*<div className="rounded-xl border border-border p-5 mt-6">[\s\S]*?<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>/, '\n        </div>\n      </div>');
    fs.writeFileSync('src/routes/you.tsx', you);
}

removeLastFM();
