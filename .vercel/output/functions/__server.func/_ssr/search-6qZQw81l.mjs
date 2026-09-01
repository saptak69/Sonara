import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as searchTracks, D as getCommunityReleasesServerFn, I as usePlayer, S as searchRadio, a as Route$6, b as searchArtists, u as TrackRow, x as searchPlaylists } from "./router-B0lYCnsa.mjs";
import { a as RadioCard, i as PlaylistCard, n as ArtistCard } from "./cards-5QXYixfg.mjs";
import { t as HomeSkeleton } from "./home-skeleton-8YQEEbYz.mjs";
import { t as Rail } from "./rail-D5jx3uJq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-6qZQw81l.js
var import_jsx_runtime = require_jsx_runtime();
function SearchPage() {
	const { q } = Route$6.useSearch();
	const recents = usePlayer((s) => s.recentSearches);
	const rememberSearch = usePlayer((s) => s.rememberSearch);
	const tracks = useQuery({
		queryKey: ["search-tracks", q],
		queryFn: async () => {
			const remote = await searchTracks(q, 24);
			try {
				const communityRows = await getCommunityReleasesServerFn({ data: { limit: 50 } });
				const term = q.toLowerCase();
				return [...communityRows.filter((c) => c.title.toLowerCase().includes(term) || c.artistName && c.artistName.toLowerCase().includes(term) || c.genre && c.genre.toLowerCase().includes(term) || c.mood && c.mood.toLowerCase().includes(term)).map((c) => ({
					id: c.id,
					title: c.title,
					artist: c.artistName || "Independent Artist",
					artistId: c.artistId,
					artwork: c.coverArtUrl,
					artworkLg: c.coverArtUrl,
					duration: c.duration,
					streamUrl: c.audioUrl,
					genre: c.genre || void 0,
					mood: c.mood || void 0,
					description: c.description || void 0,
					lyrics: c.lyrics || void 0,
					playCount: c.playCount,
					kind: "track"
				})), ...remote];
			} catch {
				return remote;
			}
		},
		enabled: q.length > 1
	});
	const playlists = useQuery({
		queryKey: ["search-playlists", q],
		queryFn: () => searchPlaylists(q, 12),
		enabled: q.length > 1
	});
	const artists = useQuery({
		queryKey: ["search-artists", q],
		queryFn: async () => {
			const remote = await searchArtists(q, 12);
			try {
				const communityRows = await getCommunityReleasesServerFn({ data: { limit: 50 } });
				const term = q.toLowerCase();
				const seen = /* @__PURE__ */ new Set();
				const matchedCommunityArtists = [];
				for (const r of communityRows) {
					if (!r.artistId || seen.has(r.artistId)) continue;
					const nameMatch = r.artistName && r.artistName.toLowerCase().includes(term);
					const handleMatch = r.artistHandle && r.artistHandle.toLowerCase().includes(term);
					if (nameMatch || handleMatch) {
						seen.add(r.artistId);
						matchedCommunityArtists.push({
							id: r.artistId,
							name: r.artistName || "Independent Artist",
							handle: r.artistHandle,
							artwork: r.artistAvatar || null,
							artworkLg: r.artistAvatar || null
						});
					}
				}
				return [...matchedCommunityArtists, ...remote];
			} catch {
				return remote;
			}
		},
		enabled: q.length > 1
	});
	const radio = useQuery({
		queryKey: ["search-radio", q],
		queryFn: () => searchRadio(q, 8),
		enabled: q.length > 1
	});
	if (!q) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-8 md:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-semibold tracking-tight",
				children: "Search"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Find songs, artists, playlists, and radio."
			}),
			recents.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium text-muted",
					children: "Recent"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: recents.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/search",
						search: { q: s },
						className: "rounded-pill bg-chip px-4 py-2 text-sm hover:bg-hover",
						onClick: () => rememberSearch(s),
						children: s
					}, s))
				})]
			}) : null
		]
	});
	if (tracks.isLoading && !tracks.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeSkeleton, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in space-y-10 px-4 py-6 md:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-[0.18em] text-subtle uppercase",
				children: "Results"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-1 text-3xl font-semibold tracking-tight",
				children: [
					"“",
					q,
					"”"
				]
			})] }),
			(tracks.data ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-xl font-semibold tracking-tight",
				children: "Songs"
			}), (tracks.data ?? []).map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
				track: t,
				index: i,
				queue: tracks.data ?? [],
				showPlays: true
			}, t.id))] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No songs matched that search."
			}),
			(artists.data ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Artists",
				children: (artists.data ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtistCard, { artist: a }, a.id))
			}) : null,
			(playlists.data ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Playlists",
				children: (playlists.data ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaylistCard, { playlist: p }, p.id))
			}) : null,
			(radio.data ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Radio",
				children: (radio.data ?? []).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioCard, { station: s }, s.id))
			}) : null
		]
	});
}
//#endregion
export { SearchPage as component };
