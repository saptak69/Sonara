const fs = require('fs');

// 1. MUSIC API
let content = fs.readFileSync('./src/lib/music-api.ts', 'utf8');

const mixStart = content.indexOf('export async function generateWeeklyMix');
let mixEnd = content.indexOf('export async function fetchRelatedQueue');
content = content.substring(0, mixStart) + `export async function generateWeeklyMix(recents: Track[]): Promise<Track[]> {
  try {
    if (!recents || recents.length === 0) {
      return fetchTrending(20);
    }
    
    // Weight by occurrence in recents
    const artists = new Map<string, number>();
    const genres = new Map<string, number>();
    
    recents.forEach((track, i) => {
      const weight = 1 + (i / recents.length); 
      if (track.artist) {
        const a = track.artist.split(',')[0].trim();
        artists.set(a, (artists.get(a) || 0) + weight);
      }
      if (track.genre) {
        genres.set(track.genre, (genres.get(track.genre) || 0) + weight);
      }
    });

    const topArtists = Array.from(artists.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]);
    const topGenres = Array.from(genres.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    
    const mix: Track[] = [];
    const seen = new Set<string>();

    const addTrack = (t: Track) => {
      const key = t.title.toLowerCase().trim() + '_' + (t.artist || '').toLowerCase().trim();
      if (!seen.has(key) && !seen.has(t.id)) {
        seen.add(key);
        seen.add(t.id);
        mix.push(t);
        return true;
      }
      return false;
    };

    const artistResults = await Promise.allSettled(
      topArtists.map(a => searchSaavnTracksServerFn({ data: { query: a + ' hits', limit: 5 } }))
    );
    let artistCount = 0;
    for (const res of artistResults) {
      if (res.status === 'fulfilled' && res.value) {
        for (const t of res.value) {
          if (artistCount < 8 && addTrack(t)) artistCount++;
        }
      }
    }

    const genreResults = await Promise.allSettled(
      topGenres.map(g => searchSaavnTracksServerFn({ data: { query: g + ' popular', limit: 5 } }))
    );
    let genreCount = 0;
    for (const res of genreResults) {
      if (res.status === 'fulfilled' && res.value) {
        for (const t of res.value) {
          if (genreCount < 6 && addTrack(t)) genreCount++;
        }
      }
    }

    const discoveryResults = await Promise.allSettled(
      topArtists.slice(0, 2).map(a => searchSaavnTracksServerFn({ data: { query: a + ' latest', limit: 4 } }))
    );
    let discCount = 0;
    for (const res of discoveryResults) {
      if (res.status === 'fulfilled' && res.value) {
        for (const t of res.value) {
          if (discCount < 4 && addTrack(t)) discCount++;
        }
      }
    }

    const trending = await fetchTrending(5);
    let trendCount = 0;
    for (const t of trending || []) {
      if (trendCount < 2 && addTrack(t)) trendCount++;
    }

    for (let i = mix.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = mix[i];
        mix[i] = mix[j];
        mix[j] = temp;
    }

    return mix.slice(0, 20);
  } catch (error) {
    console.error('Error generating weekly mix', error);
    return fetchTrending(20);
  }
}

` + content.substring(mixEnd);

const relatedStart = content.indexOf('export async function fetchRelatedQueue');
const relatedEnd = content.indexOf('export async function searchPlaylists');
content = content.substring(0, relatedStart) + `export async function fetchRelatedQueue(track: Track, limit = 15, recents: Track[] = []): Promise<Track[]> {
  try {
    const results: Track[] = [];
    const seen = new Set<string>([track.id]);
    const artistCounts = new Map<string, number>();

    const addTrack = (t: Track) => {
      if (!t.artist || (t.duration && t.duration < 45)) return false;
      const key = t.title.toLowerCase().trim() + '_' + t.artist.toLowerCase().trim();
      const aName = t.artist.toLowerCase().trim();
      const count = artistCounts.get(aName) || 0;
      if (count < 3 && !seen.has(key) && !seen.has(t.id)) {
        artistCounts.set(aName, count + 1);
        seen.add(key);
        seen.add(t.id);
        results.push(t);
        return true;
      }
      return false;
    };

    if (track.id.startsWith('saavn_')) {
      const similar = await getSimilarSongsServerFn({ data: { id: track.id, limit: limit * 2 } });
      if (similar && similar.length > 0) {
        for (const t of similar) {
          if (results.length >= limit) break;
          addTrack(t);
        }
        if (results.length >= limit) return results;
      }
    }

    if (track.artist && results.length < limit) {
      const artistQuery = track.artist.split(',')[0].trim();
      const artistTracks = await searchSaavnTracksServerFn({ data: { query: artistQuery + ' songs', limit: 15 } });
      for (const t of artistTracks) {
        if (results.length >= limit) break;
        if (t.artist?.toLowerCase().includes(artistQuery.toLowerCase())) {
          addTrack(t);
        }
      }
    }

    if (results.length < limit) {
      const langGenre = ((track.genre || '') + ' ' + (track.artist ? track.artist.split(',')[0].trim() : '')).trim();
      if (langGenre) {
        const genreTracks = await searchSaavnTracksServerFn({ data: { query: langGenre + ' popular', limit: 15 } });
        for (const t of genreTracks) {
          if (results.length >= limit) break;
          addTrack(t);
        }
      }
    }

    if (results.length < limit) {
      const trending = await fetchTrending(limit);
      for (const t of trending) {
        if (results.length >= limit) break;
        addTrack(t);
      }
    }

    return results;
  } catch (error) {
    console.error('fetchRelatedQueue error', error);
    return CURATED_TRACKS.filter((t) => t.id !== track.id).slice(0, limit);
  }
}


` + content.substring(relatedEnd);

fs.writeFileSync('./src/lib/music-api.ts', content);


// 2. SEARCH SUGGESTIONS
let sg = fs.readFileSync('./src/components/search-suggestions.tsx', 'utf8');

sg = sg.replace(/function SuggestionItemButton[\s\S]*?className=\{className\}\s*>\s*\{children\}\s*<\/button>\s*\);\s*\}/, 
`function SuggestionItemButton({
  children,
  onSelect,
  className,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
      }}
      className={className}
    >
      {children}
    </button>
  );
}`);

sg = sg.replace(/export function SearchSuggestions\(\{[\s\S]*?className\?: string;\s*\}\) \{/, 
`export function SearchSuggestions({
  query,
  isOpen,
  onClose,
  onSelectQuery,
  onLoadingChange,
  className,
}: {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (q: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
}) {`);

sg = sg.replace(/\/\/ Fetch suggestions with 150ms debounce[\s\S]*?return \(\) => clearTimeout\(timer\);\s*\}, \[query\]\);/, 
`// Fetch suggestions with 300ms debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setData({ queries: [], topMatches: [] });
      setSelectedIndex(-1);
      onLoadingChange?.(false);
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);
    const timer = setTimeout(() => {
      void fetchSearchSuggestionsServerFn({ data: { query: trimmed } })
        .then((res) => {
          setData(res);
          setSelectedIndex(-1);
        })
        .finally(() => {
          setLoading(false);
          onLoadingChange?.(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);`);
  
fs.writeFileSync('./src/components/search-suggestions.tsx', sg);


// 3. SEARCH.TSX
let search = fs.readFileSync('./src/routes/search.tsx', 'utf8');
search = search.replace('const [suggestionsOpen, setSuggestionsOpen] = useState(false);', 
  'const [suggestionsOpen, setSuggestionsOpen] = useState(false);\n  const [isSearching, setIsSearching] = useState(false);');

if (!search.includes('Loader2')) {
  search = search.replace('import { Search as SearchIcon, X } from "lucide-react";', 'import { Search as SearchIcon, X, Loader2 } from "lucide-react";');
}

search = search.replace(/\{localQ && \([\s\S]*?<SearchSuggestions/m, 
`{localQ && (
              <button type="button" onClick={() => {
                setLocalQ("");
                setSuggestionsOpen(false);
                void navigate({ to: "/search", search: { q: "" } });
              }} className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-fg min-h-[44px] min-w-[44px] flex items-center justify-center">
                {isSearching ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              </button>
            )}
            <SearchSuggestions
              onLoadingChange={setIsSearching}`);
fs.writeFileSync('./src/routes/search.tsx', search);


// 4. APP-SHELL.TSX
let app = fs.readFileSync('./src/components/app-shell.tsx', 'utf8');
app = app.replace('const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false);', 
  'const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false);\n  const [isSearchingMobile, setIsSearchingMobile] = useState(false);');
app = app.replace('const [desktopSuggestionsOpen, setDesktopSuggestionsOpen] = useState(false);', 
  'const [desktopSuggestionsOpen, setDesktopSuggestionsOpen] = useState(false);\n  const [isSearchingDesktop, setIsSearchingDesktop] = useState(false);');

if (!app.includes('Loader2')) {
  app = app.replace('import { Home, Compass, Radio, ListMusic, Heart, Plus, Search, User, Info, X } from "lucide-react";', 
    'import { Home, Compass, Radio, ListMusic, Heart, Plus, Search, User, Info, X, Loader2 } from "lucide-react";');
}

app = app.replace(/\{q && \([\s\S]*?<SearchSuggestions query=\{q\} isOpen=\{mobileSuggestionsOpen\} onClose=\{.*?\} onSelectQuery=\{executeSearch\} \/>/m, 
`{q && (
                    <button type="button" onClick={() => { setQ(""); setMobileSuggestionsOpen(false); }} className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-fg min-h-[44px] min-w-[44px] flex items-center justify-center">
                      {isSearchingMobile ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                    </button>
                  )}
                  <SearchSuggestions query={q} isOpen={mobileSuggestionsOpen} onClose={() => setMobileSuggestionsOpen(false)} onSelectQuery={executeSearch} onLoadingChange={setIsSearchingMobile} />`);

app = app.replace(/<div className="pointer-events-none absolute right-4 top-1\/2 -translate-y-1\/2 hidden sm:flex items-center text-xs font-medium text-muted">\s*⌘K\s*<\/div>\s*<SearchSuggestions query=\{q\} isOpen=\{desktopSuggestionsOpen\} onClose=\{.*?\} onSelectQuery=\{executeSearch\} \/>/m, 
`<div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center text-xs font-medium text-muted">
                  {isSearchingDesktop ? <Loader2 className="size-4 animate-spin" /> : "⌘K"}
                </div>
                <SearchSuggestions query={q} isOpen={desktopSuggestionsOpen} onClose={() => setDesktopSuggestionsOpen(false)} onSelectQuery={executeSearch} onLoadingChange={setIsSearchingDesktop} />`);

fs.writeFileSync('./src/components/app-shell.tsx', app);

console.log('All files updated successfully.');
