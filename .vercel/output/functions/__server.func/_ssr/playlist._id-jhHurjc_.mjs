import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { v as Play } from "../_libs/lucide-react.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { F as Cover, I as usePlayer, L as Button, T as formatDurationTotal, m as fetchPlaylist, n as Route$2, u as TrackRow } from "./router-B0lYCnsa.mjs";
import { t as Skeleton } from "./skeleton-CaRkZS6e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/playlist._id-jhHurjc_.js
var import_jsx_runtime = require_jsx_runtime();
function PlaylistPage() {
	const { id } = Route$2.useParams();
	const playTracks = usePlayer((s) => s.playTracks);
	const playNext = usePlayer((s) => s.playNext);
	const query = useQuery({
		queryKey: ["playlist", id],
		queryFn: () => fetchPlaylist(id)
	});
	if (query.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-4 py-8 md:px-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-48 rounded-lg" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 space-y-3 pt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-20" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-64" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-40" })
				]
			})]
		})
	});
	const playlist = query.data;
	if (!playlist) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-6 py-16 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-lg font-semibold",
			children: "Playlist not found"
		})
	});
	const tracks = playlist.tracks ?? [];
	const total = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-6 md:px-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-6 sm:flex-row sm:items-end",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
				src: playlist.artworkLg || playlist.artwork,
				alt: playlist.name,
				title: playlist.name,
				rounded: "lg",
				className: "size-44 shrink-0 sm:size-52"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.16em] text-subtle uppercase",
						children: playlist.isAlbum ? "Album" : "Playlist"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-4xl font-semibold tracking-tight",
						children: playlist.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							playlist.owner ? `${playlist.owner} · ` : "",
							tracks.length || playlist.trackCount,
							" tracks",
							total ? ` · ${formatDurationTotal(total)}` : ""
						]
					}),
					playlist.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 line-clamp-2 max-w-xl text-sm text-subtle",
						children: playlist.description
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "solid",
							onClick: () => tracks.length && playTracks(tracks, 0),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "size-4 fill-current",
								style: { marginLeft: 2 }
							}), "Play"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "chip",
							onClick: () => tracks.forEach((t, i) => i === 0 ? playTracks([t], 0) : playNext(t)),
							disabled: !tracks.length,
							children: "Add to queue"
						})]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8",
			children: tracks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
				track: t,
				index: i,
				queue: tracks
			}, t.id))
		})]
	});
}
//#endregion
export { PlaylistPage as component };
