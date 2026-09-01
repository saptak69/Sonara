import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { U as ChevronRight, W as ChevronLeft } from "../_libs/lucide-react.mjs";
import { L as Button } from "./router--X2oxkDG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rail-D5jx3uJq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SectionHeader({ title, to }) {
	const heading = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "text-xl font-semibold tracking-tight",
		children: title
	});
	if (!to) return heading;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to,
		className: "hover:underline",
		children: heading
	});
}
function Rail({ title, to, children }) {
	const ref = (0, import_react.useRef)(null);
	const scroll = (dir) => {
		ref.current?.scrollBy({
			left: dir * 420,
			behavior: "smooth"
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3 px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
				title,
				to
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden items-center gap-1 md:flex",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "chip",
					size: "iconSm",
					"aria-label": "Previous",
					onClick: () => scroll(-1),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "chip",
					size: "iconSm",
					"aria-label": "Next",
					onClick: () => scroll(1),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref,
			className: "rail -mx-4 px-4 sm:mx-0 sm:px-1",
			children
		})]
	});
}
//#endregion
export { Rail as t };
