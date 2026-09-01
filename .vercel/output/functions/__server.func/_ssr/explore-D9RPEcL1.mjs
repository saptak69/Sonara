import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { D as getCommunityReleasesServerFn, _ as fetchTrendingPlaylists, g as fetchTrending, h as fetchRadioStations } from "./router-B0lYCnsa.mjs";
import { a as RadioCard, i as PlaylistCard, t as AlbumCard } from "./cards-5QXYixfg.mjs";
import { t as HomeSkeleton } from "./home-skeleton-8YQEEbYz.mjs";
import { t as Rail } from "./rail-D5jx3uJq.mjs";
import { t as GENRES } from "./genres-HqDSRdv6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/explore-D9RPEcL1.js
var import_jsx_runtime = require_jsx_runtime();
function Explore() {
	const community = useQuery({
		queryKey: ["community-explore"],
		queryFn: async () => {
			try {
				return (await getCommunityReleasesServerFn({ data: { limit: 16 } })).map((r) => ({
					id: r.id,
					title: r.title,
					artist: r.artistName || "Independent Artist",
					artistId: r.artistId,
					artwork: r.coverArtUrl,
					artworkLg: r.coverArtUrl,
					duration: r.duration,
					streamUrl: r.audioUrl,
					genre: r.genre || void 0,
					mood: r.mood || void 0,
					description: r.description || void 0,
					lyrics: r.lyrics || void 0,
					playCount: r.playCount,
					kind: "track"
				}));
			} catch {
				return [];
			}
		}
	});
	const charts = useQuery({
		queryKey: ["charts"],
		queryFn: () => fetchTrending(16)
	});
	const playlists = useQuery({
		queryKey: ["playlists-explore"],
		queryFn: () => fetchTrendingPlaylists(12)
	});
	const radio = useQuery({
		queryKey: ["radio-featured"],
		queryFn: () => fetchRadioStations(12)
	});
	if (charts.isLoading && !charts.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeSkeleton, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in space-y-10 px-4 py-6 md:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-[0.18em] text-subtle uppercase",
				children: "Discover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 text-3xl font-semibold tracking-tight",
				children: "Explore"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-bold tracking-tight text-white",
					children: "Featured genres"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Explore distinct sounds and musical sub-cultures"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
					children: GENRES.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/genre/$slug",
						params: { slug: g.slug },
						className: "group relative flex h-28 sm:h-32 flex-col justify-end overflow-hidden rounded-2xl p-4 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-98",
						children: [
							g.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: g.image,
								alt: g.label,
								className: "absolute inset-0 h-full w-full object-cover brightness-[0.75] contrast-[1.08] saturate-[1.15] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:brightness-[0.85]",
								loading: "lazy"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 transition-opacity duration-300 group-hover:opacity-85" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative z-10 flex flex-col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md group-hover:text-accent transition-colors",
									children: g.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-medium text-white/70 drop-shadow",
									children: g.hint
								})]
							})
						]
					}, g.slug))
				})]
			}),
			(community.data ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Independent Artists & Community Releases",
				children: (community.data ?? []).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlbumCard, {
					track: t,
					queue: community.data
				}, t.id))
			}) : null,
			(charts.data ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Top songs",
				children: (charts.data ?? []).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlbumCard, {
					track: t,
					queue: charts.data
				}, t.id))
			}) : null,
			(playlists.data ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Featured playlists",
				children: (playlists.data ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaylistCard, { playlist: p }, p.id))
			}) : null,
			(radio.data ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Live radio",
				to: "/radio",
				children: (radio.data ?? []).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioCard, { station: s }, s.id))
			}) : null
		]
	});
}
//#endregion
export { Explore as component };
