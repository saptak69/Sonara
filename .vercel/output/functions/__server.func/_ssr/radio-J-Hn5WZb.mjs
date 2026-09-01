import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { I as usePlayer, L as Button, h as fetchRadioStations, y as radioToTrack } from "./router-B0lYCnsa.mjs";
import { a as RadioCard } from "./cards-5QXYixfg.mjs";
import { t as HomeSkeleton } from "./home-skeleton-8YQEEbYz.mjs";
import { t as Rail } from "./rail-D5jx3uJq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/radio-J-Hn5WZb.js
var import_jsx_runtime = require_jsx_runtime();
var TAGS = [
	"pop",
	"jazz",
	"classical",
	"electronic",
	"news",
	"chill"
];
function RadioTagRail({ tag }) {
	const stations = useQuery({
		queryKey: ["radio-tag", tag],
		queryFn: () => fetchRadioStations(12, tag)
	}).data ?? [];
	if (!stations.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
		title: tag[0].toUpperCase() + tag.slice(1),
		children: stations.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioCard, { station: s }, s.id))
	});
}
function RadioPage() {
	const playTracks = usePlayer((s) => s.playTracks);
	const popular = useQuery({
		queryKey: ["radio-popular"],
		queryFn: () => fetchRadioStations(24)
	});
	if (popular.isLoading && !popular.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeSkeleton, {});
	const all = popular.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in space-y-10 px-4 py-6 md:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.18em] text-subtle uppercase",
					children: "On air"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-3xl font-semibold tracking-tight",
					children: "Radio"
				})] }), all.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "chip",
					size: "sm",
					onClick: () => playTracks(all.map(radioToTrack), 0),
					children: "Play popular"
				}) : null]
			}),
			all.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {
				title: "Popular stations",
				children: all.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioCard, { station: s }, s.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No stations right now."
			}),
			TAGS.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioTagRail, { tag }, tag))
		]
	});
}
//#endregion
export { RadioPage as component };
