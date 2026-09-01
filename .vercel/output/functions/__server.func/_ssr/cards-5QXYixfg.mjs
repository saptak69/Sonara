import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { v as Play } from "../_libs/lucide-react.mjs";
import { F as Cover, I as usePlayer, R as cn, d as Equalizer, y as radioToTrack } from "./router-B0lYCnsa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cards-5QXYixfg.js
var import_jsx_runtime = require_jsx_runtime();
function PlayBadge({ active, playing }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("absolute right-2 bottom-2 grid size-10 place-items-center rounded-full bg-fg text-bg shadow-play", "translate-y-2 opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]", "group-hover:translate-y-0 group-hover:opacity-100", active && playing && "translate-y-0 opacity-100"),
		children: active && playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Equalizer, { className: "[&_span]:bg-bg" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
			className: "size-5 fill-current",
			style: { marginLeft: 2 }
		})
	});
}
function AlbumCard({ track, queue }) {
	const playTracks = usePlayer((s) => s.playTracks);
	const current = usePlayer((s) => s.queue[s.index]);
	const isPlaying = usePlayer((s) => s.isPlaying);
	const active = current?.id === track.id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => playTracks(queue?.length ? queue : [track], queue?.findIndex((t) => t.id === track.id) ?? 0),
		className: "group w-36 shrink-0 snap-start text-left sm:w-40",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
					src: track.artworkLg || track.artwork,
					alt: track.title,
					title: track.title,
					className: "aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBadge, {
					active,
					playing: isPlaying
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("mt-2 block truncate text-sm font-medium", active && "text-accent"),
				children: track.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-xs text-muted",
				children: track.artist
			})
		]
	});
}
function PlaylistCard({ playlist }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/playlist/$id",
		params: { id: playlist.id },
		className: "group w-36 shrink-0 snap-start sm:w-40",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
					src: playlist.artworkLg || playlist.artwork,
					alt: playlist.name,
					title: playlist.name,
					className: "aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBadge, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-2 block truncate text-sm font-medium",
				children: playlist.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "block truncate text-xs text-muted",
				children: [playlist.isAlbum ? "Album" : "Playlist", playlist.owner ? ` · ${playlist.owner}` : ""]
			})
		]
	});
}
function ArtistCard({ artist }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/artist/$id",
		params: { id: artist.id },
		className: "group w-32 shrink-0 snap-start text-center sm:w-36",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
				src: artist.artworkLg || artist.artwork,
				alt: artist.name,
				title: artist.name,
				rounded: "full",
				className: "mx-auto aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-2 block truncate text-sm font-medium",
				children: artist.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-xs text-muted",
				children: "Artist"
			})
		]
	});
}
function RadioCard({ station }) {
	const playTrack = usePlayer((s) => s.playTrack);
	const current = usePlayer((s) => s.queue[s.index]);
	const isPlaying = usePlayer((s) => s.isPlaying);
	const track = radioToTrack(station);
	const active = current?.id === track.id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => playTrack(track),
		className: "group w-36 shrink-0 snap-start text-left sm:w-40",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
					src: station.artwork,
					alt: station.name,
					title: station.name,
					className: "aspect-square w-full"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBadge, {
					active,
					playing: isPlaying
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("mt-2 block truncate text-sm font-medium", active && "text-accent"),
				children: station.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "block truncate text-xs text-muted",
				children: [station.country || "Live", " · Radio"]
			})
		]
	});
}
function MoodCard({ label, query, subtitle, image }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/search",
		search: { q: query },
		className: "group relative flex h-28 sm:h-32 min-w-36 flex-1 flex-col justify-end overflow-hidden rounded-2xl p-4 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-98",
		children: [
			image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: image,
				alt: label,
				className: "absolute inset-0 h-full w-full object-cover brightness-[0.75] contrast-[1.08] saturate-[1.15] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:brightness-[0.85]",
				loading: "lazy"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 transition-opacity duration-300 group-hover:opacity-85" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 flex flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md group-hover:text-accent transition-colors",
					children: label
				}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] font-medium text-white/70 drop-shadow",
					children: subtitle
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 scale-75",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5 fill-current ml-0.5" })
			})
		]
	});
}
//#endregion
export { RadioCard as a, PlaylistCard as i, ArtistCard as n, MoodCard as r, AlbumCard as t };
