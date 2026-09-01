import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as signIn, t as authClient } from "./client-B40BzJxt.mjs";
import { t as GROK_PROVIDERS } from "./server-CVSnNY8q.mjs";
import { E as Lock, S as Music2, i as User, l as Sparkles, w as Mail } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { L as Button, P as Logo, o as useCurrentUserState } from "./router-B0lYCnsa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CKeZNfBN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const navigate = useNavigate();
	const { user, isPending } = useCurrentUserState();
	const [tab, setTab] = (0, import_react.useState)("signin");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	if (!isPending && user && !user.isDevFallback) {
		navigate({ to: "/studio" });
		return null;
	}
	const handleSignIn = async (e) => {
		e.preventDefault();
		if (!email || !password) {
			toast.error("Please enter both email and password.");
			return;
		}
		setLoading(true);
		try {
			const res = await authClient.signIn.email({
				email: email.trim(),
				password
			});
			if (res.error) toast.error(res.error.message || "Sign in failed. Check credentials.");
			else {
				toast.success("Welcome back to Sonara!");
				navigate({ to: "/studio" });
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Authentication error";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};
	const handleSignUp = async (e) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Please enter your display name.");
			return;
		}
		if (!email.trim() || !password) {
			toast.error("Please enter an email and password.");
			return;
		}
		if (password.length < 6) {
			toast.error("Password must be at least 6 characters.");
			return;
		}
		setLoading(true);
		try {
			const res = await authClient.signUp.email({
				name: name.trim(),
				email: email.trim(),
				password
			});
			if (res.error) toast.error(res.error.message || "Registration failed. Try again.");
			else {
				toast.success("Account created successfully! Welcome to Sonara.");
				navigate({ to: "/studio" });
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Sign up error";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-[85vh] flex items-center justify-center px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-3xl bg-black/55 backdrop-blur-3xl border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -top-24 -left-24 size-48 rounded-full bg-accent/20 blur-3xl" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -bottom-24 -right-24 size-48 rounded-full bg-accent/20 blur-3xl" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center text-center mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { compact: false })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs sm:text-sm text-muted mt-1",
						children: "Independent music streaming & artist release platform"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 p-1 bg-white/5 rounded-2xl border border-white/10 mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setTab("signin"),
						className: `py-2 text-xs sm:text-sm font-medium rounded-xl transition-all ${tab === "signin" ? "bg-white/15 text-fg shadow border border-white/20" : "text-muted hover:text-fg"}`,
						children: "Sign In"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setTab("signup"),
						className: `py-2 text-xs sm:text-sm font-medium rounded-xl transition-all ${tab === "signup" ? "bg-white/15 text-fg shadow border border-white/20" : "text-muted hover:text-fg"}`,
						children: "Create Account"
					})]
				}),
				tab === "signin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSignIn,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted mb-1.5",
							children: "Email address"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								required: true,
								value: email,
								onChange: (e) => setEmail(e.target.value),
								placeholder: "artist@sonara.io",
								className: "h-11 w-full rounded-xl bg-black/60 pr-4 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted mb-1.5",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								required: true,
								value: password,
								onChange: (e) => setPassword(e.target.value),
								placeholder: "••••••••",
								className: "h-11 w-full rounded-xl bg-black/60 pr-4 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: loading,
							className: "w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium text-sm transition-all active:scale-[0.99] shadow-lg shadow-accent/20",
							children: loading ? "Signing in..." : "Sign In to Sonara"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSignUp,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted mb-1.5",
							children: "Artist / Display Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								required: true,
								value: name,
								onChange: (e) => setName(e.target.value),
								placeholder: "e.g. Luna Sounds",
								className: "h-11 w-full rounded-xl bg-black/60 pr-4 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted mb-1.5",
							children: "Email address"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								required: true,
								value: email,
								onChange: (e) => setEmail(e.target.value),
								placeholder: "artist@sonara.io",
								className: "h-11 w-full rounded-xl bg-black/60 pr-4 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted mb-1.5",
							children: "Password (min. 6 characters)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								required: true,
								minLength: 6,
								value: password,
								onChange: (e) => setPassword(e.target.value),
								placeholder: "••••••••",
								className: "h-11 w-full rounded-xl bg-black/60 pr-4 pl-10 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/15 backdrop-blur-xl"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: loading,
							className: "w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium text-sm transition-all active:scale-[0.99] shadow-lg shadow-accent/20",
							children: loading ? "Creating account..." : "Join Sonara"
						})
					]
				}),
				GROK_PROVIDERS.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 pt-5 border-t border-white/10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-center text-muted uppercase tracking-wider mb-3",
						children: "Or continue with"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col gap-2",
						children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void signIn(p.providerId),
							className: "w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-medium gap-2 text-fg flex items-center justify-center transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5 text-accent" }),
								"Sign in with ",
								p.label
							]
						}, p.providerId))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted flex items-center justify-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music2, { className: "size-3.5 text-accent" }), "Artists can upload and stream songs immediately upon sign-in."]
					})
				})
			]
		})
	});
}
//#endregion
export { LoginPage as component };
