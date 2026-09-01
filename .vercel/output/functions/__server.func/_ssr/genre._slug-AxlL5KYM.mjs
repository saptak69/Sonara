import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as searchTracks, I as usePlayer, L as Button, g as fetchTrending, r as Route$3, u as TrackRow, z as hashHue } from "./router-B0lYCnsa.mjs";
import { t as AlbumCard } from "./cards-5QXYixfg.mjs";
import { t as HomeSkeleton } from "./home-skeleton-8YQEEbYz.mjs";
import { r as genreBySlug } from "./genres-HqDSRdv6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/genre._slug-AxlL5KYM.js
var import_jsx_runtime = require_jsx_runtime();
function GenrePage() {
	const { slug } = Route$3.useParams();
	const genre = genreBySlug(slug);
	const playTracks = usePlayer((s) => s.playTracks);
	const query = useQuery({
		queryKey: ["genre", slug],
		queryFn: async () => {
			if (!genre) return searchTracks(slug, 24);
			const trending = await fetchTrending(24, genre.api);
			if (trending.length) return trending;
			return searchTracks(genre.label, 24);
		}
	});
	if (query.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeSkeleton, {});
	const tracks = query.data ?? [];
	const tone = hashHue(slug);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-6 md:px-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8 overflow-hidden rounded-xl px-6 py-10",
			style: { background: `linear-gradient(135deg, hsl(${tone} 32% 28%), hsl(${tone} 16% 8%))` },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.16em] text-fg/70 uppercase",
					children: "Genre"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-4xl font-semibold tracking-tight",
					children: genre?.label ?? slug
				}),
				genre?.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-fg/70",
					children: genre.hint
				}) : null,
				tracks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "solid",
					className: "mt-5",
					onClick: () => playTracks(tracks, 0),
					children: "Play all"
				}) : null
			]
		}), tracks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-8 flex gap-4 overflow-x-auto [scrollbar-width:none]",
			children: tracks.slice(0, 10).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlbumCard, {
				track: t,
				queue: tracks
			}, t.id))
		}), tracks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
			track: t,
			index: i,
			queue: tracks,
			showPlays: true
		}, `row-${t.id}`))] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Nothing in this lane yet."
		})]
	});
}
//#endregion
export { GenrePage as component };
