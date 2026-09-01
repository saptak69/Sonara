import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { F as Cover, I as usePlayer, L as Button, R as cn, u as TrackRow } from "./router-B0lYCnsa.mjs";
import { t as AlbumCard } from "./cards-5QXYixfg.mjs";
import { t as Rail } from "./rail-D5jx3uJq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-XC1plz1D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LibraryPage() {
	const recents = usePlayer((s) => s.recents);
	const likedIds = usePlayer((s) => s.likedIds);
	const playlists = usePlayer((s) => s.playlists);
	const playTracks = usePlayer((s) => s.playTracks);
	const createPlaylist = usePlayer((s) => s.createPlaylist);
	const deletePlaylist = usePlayer((s) => s.deletePlaylist);
	const [tab, setTab] = (0, import_react.useState)("recents");
	const likedTracks = (0, import_react.useMemo)(() => {
		const fromPlaylists = playlists.find((p) => p.id === "likes")?.tracks ?? [];
		const fromRecents = recents.filter((t) => likedIds.includes(t.id));
		const map = new Map(fromPlaylists.map((t) => [t.id, t]));
		for (const t of fromRecents) map.set(t.id, t);
		return likedIds.map((id) => map.get(id)).filter((t) => Boolean(t));
	}, [
		likedIds,
		playlists,
		recents
	]);
	const userPlaylists = (0, import_react.useMemo)(() => playlists.filter((p) => p.id !== "likes").map((p) => ({
		id: p.id,
		name: p.name,
		artwork: p.tracks[0]?.artworkLg || p.tracks[0]?.artwork || null,
		artworkLg: p.tracks[0]?.artworkLg || null,
		trackCount: p.tracks.length,
		isAlbum: false,
		tracks: p.tracks
	})), [playlists]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in space-y-8 px-4 py-6 md:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.18em] text-subtle uppercase",
					children: "Yours"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-3xl font-semibold tracking-tight",
					children: "Library"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "chip",
					size: "sm",
					onClick: () => createPlaylist(`Playlist ${playlists.length + 1}`),
					children: "New playlist"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 border-b border-border/40 pb-3 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0",
				children: [
					["recents", "Recents"],
					["likes", "Liked"],
					["playlists", "Playlists"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all duration-150 active:scale-95 shrink-0", tab === id ? "bg-elevated/90 text-fg border border-border/60 shadow-sm" : "bg-chip/60 text-muted hover:bg-chip hover:text-fg"),
					onClick: () => setTab(id),
					children: label
				}, id))
			}),
			tab === "recents" ? recents.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Recently played",
				children: recents.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlbumCard, {
					track: t,
					queue: recents
				}, t.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "Play something and it will land here." }) : null,
			tab === "likes" ? likedTracks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [likedTracks.length, " tracks"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "solid",
					size: "sm",
					onClick: () => playTracks(likedTracks, 0),
					children: "Play all"
				})]
			}), likedTracks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
				track: t,
				index: i,
				queue: likedTracks
			}, t.id))] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "Tap the heart on a track to save it." }) : null,
			tab === "playlists" ? userPlaylists.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
				children: playlists.filter((p) => p.id !== "likes").map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "group",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "w-full text-left",
						onClick: () => p.tracks.length && playTracks(p.tracks, 0),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
								src: p.tracks[0]?.artworkLg || p.tracks[0]?.artwork,
								alt: p.name,
								title: p.name,
								className: "aspect-square w-full"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 truncate text-sm font-medium",
								children: p.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [p.tracks.length, " tracks"]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-1 text-xs text-subtle hover:text-fg",
						onClick: () => deletePlaylist(p.id),
						children: "Remove"
					})]
				}, p.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "Create a playlist from any track menu." }) : null
		]
	});
}
function Empty({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl bg-elevated px-6 py-16 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: text
		})
	});
}
//#endregion
export { LibraryPage as component };
