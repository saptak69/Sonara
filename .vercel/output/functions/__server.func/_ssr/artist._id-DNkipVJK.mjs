import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { B as CircleCheck, R as Disc, l as Sparkles, v as Play } from "../_libs/lucide-react.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as getPublicArtistProfileServerFn, F as Cover, I as usePlayer, L as Button, f as fetchArtist, i as Route$4, j as getPublicArtistTracksServerFn, p as fetchArtistTracks, u as TrackRow, w as formatCount } from "./router-B0lYCnsa.mjs";
import { t as Skeleton } from "./skeleton-CaRkZS6e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/artist._id-DNkipVJK.js
var import_jsx_runtime = require_jsx_runtime();
function ArtistPage() {
	const { id } = Route$4.useParams();
	const playTracks = usePlayer((s) => s.playTracks);
	const communityProfileQuery = useQuery({
		queryKey: ["community-artist-profile", id],
		queryFn: async () => {
			try {
				return await getPublicArtistProfileServerFn({ data: { idOrHandle: id } });
			} catch {
				return null;
			}
		}
	});
	const communityTracksQuery = useQuery({
		queryKey: ["community-artist-tracks", id],
		queryFn: async () => {
			try {
				return (await getPublicArtistTracksServerFn({ data: {
					artistId: id,
					limit: 50
				} })).map((r) => ({
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
		},
		enabled: Boolean(communityProfileQuery.data)
	});
	const remoteArtistQuery = useQuery({
		queryKey: ["remote-artist", id],
		queryFn: () => fetchArtist(id),
		enabled: !communityProfileQuery.isLoading && !communityProfileQuery.data
	});
	const remoteTracksQuery = useQuery({
		queryKey: ["remote-artist-tracks", id],
		queryFn: () => fetchArtistTracks(id, 40),
		enabled: !communityProfileQuery.isLoading && !communityProfileQuery.data && Boolean(remoteArtistQuery.data)
	});
	if (communityProfileQuery.isLoading || !communityProfileQuery.data && remoteArtistQuery.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-4 py-8 md:px-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-36 rounded-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-20" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-48" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-32" })
				]
			})]
		})
	});
	if (Boolean(communityProfileQuery.data) && communityProfileQuery.data) {
		const { profile, trackCount, totalPlays } = communityProfileQuery.data;
		const tracks = communityTracksQuery.data ?? [];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stagger-in px-4 py-6 md:px-8 space-y-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-black/60 p-6 md:p-8 backdrop-blur-2xl shadow-2xl",
				children: [profile.bannerUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 -z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: profile.bannerUrl,
						alt: profile.displayName,
						className: "h-full w-full object-cover opacity-35 filter brightness-90 saturate-125"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" })]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 -z-10 bg-gradient-to-tr from-accent/20 via-purple-900/20 to-black" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-start gap-6 sm:flex-row sm:items-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
						src: profile.avatarUrl,
						alt: profile.displayName,
						title: profile.displayName,
						rounded: "full",
						className: "size-36 shrink-0 border-2 border-white/20 shadow-2xl sm:size-44"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-0.5 text-xs font-semibold text-accent border border-accent/30",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), "Independent Artist"]
								}), profile.verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/30",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }), "Verified"]
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md",
								children: profile.displayName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm font-medium text-subtle",
								children: ["@", profile.handle]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									trackCount,
									" published ",
									trackCount === 1 ? "track" : "tracks"
								] }), totalPlays > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [formatCount(totalPlays), " total streams"] })] }) : null]
							}),
							profile.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted line-clamp-3",
								children: profile.bio
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 flex flex-wrap items-center gap-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "solid",
									className: "rounded-full px-6 shadow-lg hover:shadow-accent/25",
									onClick: () => tracks.length && playTracks(tracks, 0),
									disabled: !tracks.length,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4 fill-current mr-1.5" }), "Play All"]
								})
							})
						]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-between px-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold tracking-tight text-white",
						children: "Releases & Discography"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: ["Official audio uploaded and verified by ", profile.displayName]
					})] })
				}), tracks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-1",
					children: tracks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
						track: t,
						index: i,
						queue: tracks,
						showPlays: true
					}, t.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disc, { className: "mx-auto size-10 text-muted opacity-60" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm font-medium text-fg",
							children: "No public releases yet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: "This artist hasn't published any public tracks on Sonara yet."
						})
					]
				})]
			})]
		});
	}
	const a = remoteArtistQuery.data;
	if (!a) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-6 py-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-lg font-semibold",
			children: "Artist not found"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "The requested artist profile could not be found."
		})]
	});
	const list = remoteTracksQuery.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in px-4 py-6 md:px-8 space-y-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-start gap-5 sm:flex-row sm:items-end",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
				src: a.artworkLg || a.artwork,
				alt: a.name,
				title: a.name,
				rounded: "full",
				className: "size-36 shrink-0 sm:size-44 border border-white/10 shadow-xl"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.16em] text-subtle uppercase",
						children: "Artist"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-4xl font-semibold tracking-tight text-white",
						children: a.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							formatCount(a.followerCount),
							" followers",
							a.trackCount ? ` · ${a.trackCount} tracks` : ""
						]
					}),
					a.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 line-clamp-3 max-w-xl text-sm text-subtle",
						children: a.bio
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "solid",
						className: "mt-5 rounded-full px-6",
						onClick: () => list.length && playTracks(list, 0),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4 fill-current mr-1.5" }), "Play"]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-xl font-semibold tracking-tight",
				children: "Popular"
			}), list.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
				track: t,
				index: i,
				queue: list,
				showPlays: true
			}, t.id))]
		})]
	});
}
//#endregion
export { ArtistPage as component };
