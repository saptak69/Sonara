import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { B as CircleCheck, F as Headphones, I as FileAudio, M as Image, R as Disc, _ as Plus, b as Pause, c as Trash2, j as Layers, o as Upload, v as Play, x as Music, y as PenLine } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { E as deleteArtistTrackServerFn, F as Cover, I as usePlayer, L as Button, M as publishTrackServerFn, N as updateArtistProfileServerFn, O as getMyArtistTracksServerFn, c as DialogContent, k as getOrCreateArtistProfileServerFn, l as DialogTrigger, o as useCurrentUserState, s as Dialog } from "./router-B0lYCnsa.mjs";
import { n as MOODS, t as GENRES } from "./genres-HqDSRdv6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio-QcgGYK1W.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ArtistStudioPage() {
	const navigate = useNavigate();
	const { user, isPending } = useCurrentUserState();
	const playTrack = usePlayer((s) => s.playTrack);
	const currentTrack = usePlayer((s) => s.queue[s.index]);
	const isPlayerPlaying = usePlayer((s) => s.isPlaying);
	const togglePlay = usePlayer((s) => s.toggle);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [tracks, setTracks] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [editProfileOpen, setEditProfileOpen] = (0, import_react.useState)(false);
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [handle, setHandle] = (0, import_react.useState)("");
	const [bio, setBio] = (0, import_react.useState)("");
	const [avatarUrl, setAvatarUrl] = (0, import_react.useState)("");
	const [savingProfile, setSavingProfile] = (0, import_react.useState)(false);
	const [uploadModalOpen, setUploadModalOpen] = (0, import_react.useState)(false);
	const [title, setTitle] = (0, import_react.useState)("");
	const [genre, setGenre] = (0, import_react.useState)("Lo-Fi");
	const [mood, setMood] = (0, import_react.useState)("Chill");
	const [description, setDescription] = (0, import_react.useState)("");
	const [lyrics, setLyrics] = (0, import_react.useState)("");
	const [audioUrl, setAudioUrl] = (0, import_react.useState)("");
	const [audioStorageKey, setAudioStorageKey] = (0, import_react.useState)("");
	const [audioDuration, setAudioDuration] = (0, import_react.useState)(0);
	const [audioFileSize, setAudioFileSize] = (0, import_react.useState)(0);
	const [audioMimeType, setAudioMimeType] = (0, import_react.useState)("audio/mpeg");
	const [audioFileName, setAudioFileName] = (0, import_react.useState)("");
	const [coverArtUrl, setCoverArtUrl] = (0, import_react.useState)("");
	const [rightsConfirmed, setRightsConfirmed] = (0, import_react.useState)(false);
	const [uploadingAudio, setUploadingAudio] = (0, import_react.useState)(false);
	const [uploadingArt, setUploadingArt] = (0, import_react.useState)(false);
	const [publishing, setPublishing] = (0, import_react.useState)(false);
	const [previewPlaying, setPreviewPlaying] = (0, import_react.useState)(false);
	const previewAudioRef = (0, import_react.useRef)(null);
	const loadData = async () => {
		try {
			setLoading(true);
			const prof = await getOrCreateArtistProfileServerFn();
			setProfile(prof);
			setDisplayName(prof.displayName);
			setHandle(prof.handle);
			setBio(prof.bio || "");
			setAvatarUrl(prof.avatarUrl || "");
			const myTracks = await getMyArtistTracksServerFn();
			setTracks(myTracks);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load studio data";
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (!isPending && user) loadData();
	}, [user, isPending]);
	const handleAudioUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.name.match(/\.(mp3|wav|aac|m4a|ogg|flac)$/i)) {
			toast.error("Please select a valid audio file (MP3, WAV, AAC, M4A, FLAC).");
			return;
		}
		if (file.size > 62914560) {
			toast.error("Audio file exceeds 60MB limit.");
			return;
		}
		setUploadingAudio(true);
		setAudioFileName(file.name);
		const audioObj = document.createElement("audio");
		audioObj.src = URL.createObjectURL(file);
		audioObj.onloadedmetadata = () => {
			setAudioDuration(audioObj.duration || 0);
		};
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("category", "audio");
			const res = await fetch("/api/storage/upload", {
				method: "POST",
				body: formData
			});
			const data = await res.json();
			if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
			setAudioUrl(data.url);
			setAudioStorageKey(data.storageKey);
			setAudioFileSize(data.fileSize);
			setAudioMimeType(data.mimeType);
			toast.success("Audio file uploaded successfully!");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to upload audio file.";
			toast.error(msg);
			setAudioFileName("");
		} finally {
			setUploadingAudio(false);
		}
	};
	const handleArtworkUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.name.match(/\.(jpe?g|png|webp|avif)$/i)) {
			toast.error("Please select a valid image (JPG, PNG, WebP).");
			return;
		}
		if (file.size > 10485760) {
			toast.error("Image file exceeds 10MB limit.");
			return;
		}
		setUploadingArt(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("category", "artwork");
			const res = await fetch("/api/storage/upload", {
				method: "POST",
				body: formData
			});
			const data = await res.json();
			if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
			setCoverArtUrl(data.url);
			toast.success("Artwork uploaded successfully!");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to upload artwork.";
			toast.error(msg);
		} finally {
			setUploadingArt(false);
		}
	};
	const handlePublish = async (e, status) => {
		e.preventDefault();
		if (!title.trim()) {
			toast.error("Please enter a track title.");
			return;
		}
		if (!audioUrl || !audioStorageKey) {
			toast.error("Please upload an audio recording.");
			return;
		}
		if (!rightsConfirmed) {
			toast.error("You must confirm you hold all rights to this recording.");
			return;
		}
		setPublishing(true);
		try {
			await publishTrackServerFn({ data: {
				title: title.trim(),
				genre,
				mood,
				description: description.trim() || void 0,
				lyrics: lyrics.trim() || void 0,
				coverArtUrl: coverArtUrl || void 0,
				audioUrl,
				storageKey: audioStorageKey,
				duration: audioDuration,
				fileSize: audioFileSize,
				mimeType: audioMimeType,
				status,
				rightsConfirmed
			} });
			toast.success(status === "published" ? "Single published to Sonara! It is now live in discovery." : "Track saved to your drafts.");
			setTitle("");
			setDescription("");
			setLyrics("");
			setAudioUrl("");
			setAudioStorageKey("");
			setCoverArtUrl("");
			setAudioFileName("");
			setRightsConfirmed(false);
			setUploadModalOpen(false);
			loadData();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to publish track.";
			toast.error(msg);
		} finally {
			setPublishing(false);
		}
	};
	const handleSaveProfile = async (e) => {
		e.preventDefault();
		setSavingProfile(true);
		try {
			await updateArtistProfileServerFn({ data: {
				displayName: displayName.trim(),
				handle: handle.trim().toLowerCase(),
				bio: bio.trim() || void 0,
				avatarUrl: avatarUrl.trim() || void 0
			} });
			toast.success("Artist profile updated!");
			setEditProfileOpen(false);
			loadData();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to update profile";
			toast.error(msg);
		} finally {
			setSavingProfile(false);
		}
	};
	const handleDelete = async (trackId, trackTitle) => {
		if (!confirm(`Are you sure you want to delete "${trackTitle}"?`)) return;
		try {
			await deleteArtistTrackServerFn({ data: { trackId } });
			toast.success("Track deleted.");
			setTracks((prev) => prev.filter((t) => t.id !== trackId));
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to delete track";
			toast.error(msg);
		}
	};
	if (!isPending && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-[75vh] flex items-center justify-center px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-3xl bg-black/55 backdrop-blur-3xl border border-white/15 p-8 text-center shadow-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-16 place-items-center rounded-2xl bg-accent/20 border border-accent/30 mx-auto mb-4 text-accent",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disc, { className: "size-8 animate-spin-slow" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold text-fg mb-2",
					children: "Sonara Artist Studio"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs sm:text-sm text-muted mb-6",
					children: "Upload your original songs, reach listeners worldwide, and view your streaming analytics."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => void navigate({ to: "/login" }),
					className: "w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium",
					children: "Sign In or Create Account"
				})
			]
		})
	});
	const totalPlays = tracks.reduce((acc, t) => acc + (t.playCount || 0), 0);
	const publishedTracks = tracks.filter((t) => t.status === "published");
	const draftTracks = tracks.filter((t) => t.status === "draft");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-3xl bg-black/45 backdrop-blur-3xl border border-white/15 p-6 md:p-8 shadow-2xl relative overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-accent/20 blur-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
							src: profile?.avatarUrl || user?.profileImageUrl,
							alt: profile?.displayName || "Artist",
							title: profile?.displayName || "Artist",
							rounded: "full",
							className: "size-16 sm:size-20 border-2 border-white/20 shadow-lg"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-xl sm:text-2xl font-bold text-fg",
									children: profile?.displayName || user?.displayName || "Independent Artist"
								}), profile?.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									title: "Verified Artist",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-5 text-accent fill-accent/20" })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs sm:text-sm text-muted",
								children: ["@", profile?.handle || "artist"]
							}),
							profile?.bio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted/80 mt-1 max-w-md",
								children: profile.bio
							})
						] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 w-full sm:w-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
							open: editProfileOpen,
							onOpenChange: setEditProfileOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									className: "flex-1 sm:flex-none rounded-xl gap-2 text-xs border border-white/15 bg-white/5 hover:bg-white/10",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "size-3.5" }), "Edit Profile"]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
								title: "Edit Artist Profile",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: handleSaveProfile,
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-medium text-muted mb-1",
											children: "Artist Display Name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											required: true,
											value: displayName,
											onChange: (e) => setDisplayName(e.target.value),
											className: "h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-medium text-muted mb-1",
											children: "Artist Handle (@)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											required: true,
											value: handle,
											onChange: (e) => setHandle(e.target.value),
											className: "h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-medium text-muted mb-1",
											children: "Avatar URL"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: avatarUrl,
											onChange: (e) => setAvatarUrl(e.target.value),
											placeholder: "https://...",
											className: "h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-medium text-muted mb-1",
											children: "Artist Bio"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											rows: 3,
											value: bio,
											onChange: (e) => setBio(e.target.value),
											placeholder: "Tell listeners about your music and story...",
											className: "w-full rounded-xl bg-black/60 p-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20 resize-none"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											disabled: savingProfile,
											className: "w-full rounded-xl bg-accent text-white",
											children: savingProfile ? "Saving..." : "Save Profile"
										})
									]
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
							open: uploadModalOpen,
							onOpenChange: setUploadModalOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "flex-1 sm:flex-none rounded-xl gap-2 text-xs bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Upload Single"]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
								title: "Upload Single to Sonara",
								className: "max-w-xl max-h-[90vh] overflow-y-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "space-y-4 pt-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-medium text-muted mb-1",
											children: "Song Title *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											required: true,
											value: title,
											onChange: (e) => setTitle(e.target.value),
											placeholder: "e.g. Midnight Reverie",
											className: "h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-medium text-muted mb-1",
												children: "Genre"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												value: genre,
												onChange: (e) => setGenre(e.target.value),
												className: "h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20",
												children: GENRES.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: g.label,
													className: "bg-neutral-900 text-fg",
													children: g.label
												}, g.slug))
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-medium text-muted mb-1",
												children: "Mood"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												value: mood,
												onChange: (e) => setMood(e.target.value),
												className: "h-10 w-full rounded-xl bg-black/60 px-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20",
												children: MOODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: m.label,
													className: "bg-neutral-900 text-fg",
													children: m.label
												}, m.id))
											})] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-center",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileAudio, { className: "size-8 mx-auto text-accent mb-2" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs font-medium text-fg mb-1",
													children: audioFileName ? audioFileName : "Select Audio Recording (MP3, WAV, AAC, M4A)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] text-muted mb-3",
													children: "Max file size: 60MB"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-fg cursor-pointer transition-colors",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }),
														uploadingAudio ? "Uploading to Storage..." : "Choose Audio File",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "file",
															accept: "audio/*,.mp3,.wav,.aac,.m4a,.flac",
															onChange: handleAudioUpload,
															disabled: uploadingAudio,
															className: "hidden"
														})
													]
												}),
												audioUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2 text-xs text-accent",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																"Ready for release (",
																Math.round(audioDuration),
																"s)"
															] })]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
															ref: previewAudioRef,
															src: audioUrl
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
															type: "button",
															variant: "ghost",
															onClick: () => {
																if (!previewAudioRef.current) return;
																if (previewPlaying) {
																	previewAudioRef.current.pause();
																	setPreviewPlaying(false);
																} else {
																	previewAudioRef.current.play();
																	setPreviewPlaying(true);
																}
															},
															className: "h-8 px-2.5 rounded-lg text-xs gap-1.5",
															children: [previewPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" }), "Audition"]
														})
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-center",
											children: coverArtUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: coverArtUrl,
													alt: "Cover",
													className: "size-14 rounded-xl object-cover border border-white/15"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-left flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs font-medium text-fg",
														children: "Artwork Loaded"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "text-[11px] text-accent cursor-pointer hover:underline",
														children: ["Change artwork", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "file",
															accept: "image/*,.jpg,.jpeg,.png,.webp",
															onChange: handleArtworkUpload,
															className: "hidden"
														})]
													})]
												})]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-8 mx-auto text-accent mb-2" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs font-medium text-fg mb-1",
													children: "Upload Album Artwork (JPG, PNG, WebP)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] text-muted mb-3",
													children: "Square aspect ratio recommended"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-fg cursor-pointer transition-colors",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }),
														uploadingArt ? "Uploading..." : "Choose Artwork",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "file",
															accept: "image/*,.jpg,.jpeg,.png,.webp",
															onChange: handleArtworkUpload,
															disabled: uploadingArt,
															className: "hidden"
														})
													]
												})
											] })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-medium text-muted mb-1",
											children: "Track Description / Liner Notes (Optional)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											rows: 2,
											value: description,
											onChange: (e) => setDescription(e.target.value),
											placeholder: "Story behind the track...",
											className: "w-full rounded-xl bg-black/60 p-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20 resize-none"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-medium text-muted mb-1",
											children: "Lyrics (Optional)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											rows: 3,
											value: lyrics,
											onChange: (e) => setLyrics(e.target.value),
											placeholder: "Enter lyrics for the full player view...",
											className: "w-full rounded-xl bg-black/60 p-3 text-xs sm:text-sm text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20 resize-none"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-xl bg-white/5 p-3.5 border border-white/10",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex items-start gap-2.5 cursor-pointer select-none",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: rightsConfirmed,
													onChange: (e) => setRightsConfirmed(e.target.checked),
													className: "mt-0.5 size-4 rounded accent-accent"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs text-muted leading-relaxed",
													children: "I declare that I own or control 100% of the copyright in this audio recording and artwork, and authorize Sonara to host and stream it to listeners worldwide."
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3 pt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "ghost",
												disabled: publishing || uploadingAudio,
												onClick: (e) => void handlePublish(e, "draft"),
												className: "flex-1 rounded-xl text-xs border border-white/15 bg-white/5 hover:bg-white/10",
												children: "Save as Draft"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												disabled: publishing || uploadingAudio || !audioUrl || !rightsConfirmed,
												onClick: (e) => void handlePublish(e, "published"),
												className: "flex-1 rounded-xl text-xs bg-accent hover:bg-accent/90 text-white font-medium shadow-lg shadow-accent/20",
												children: publishing ? "Publishing..." : "Publish Single"
											})]
										})
									]
								})
							})]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 sm:grid-cols-3 gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 p-5 shadow-lg flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-12 place-items-center rounded-xl bg-accent/15 text-accent border border-accent/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Headphones, { className: "size-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted font-medium",
							children: "Total Verified Plays"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-bold text-fg mt-0.5",
							children: totalPlays.toLocaleString()
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 p-5 shadow-lg flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-12 place-items-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disc, { className: "size-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted font-medium",
							children: "Published Singles"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-bold text-fg mt-0.5",
							children: publishedTracks.length
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 p-5 shadow-lg flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-12 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted font-medium",
							children: "Draft Recordings"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-bold text-fg mt-0.5",
							children: draftTracks.length
						})] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-between",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-bold text-fg",
						children: "Your Music Discography"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Manage your releases, audio assets, and stream counts"
					})] })
				}), tracks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 p-12 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music, { className: "size-12 mx-auto text-muted/50 mb-3" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-semibold text-fg mb-1",
							children: "No songs uploaded yet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted max-w-sm mx-auto mb-4",
							children: "Click \"Upload Single\" above to upload your first original recording to Sonara."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => setUploadModalOpen(true),
							className: "rounded-xl bg-accent hover:bg-accent/90 text-white text-xs gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Upload Your First Song"]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-left border-collapse",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-white/10 text-xs font-semibold text-muted bg-white/5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-3.5 px-4",
										children: "Track"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-3.5 px-4",
										children: "Genre / Mood"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-3.5 px-4",
										children: "Status"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-3.5 px-4",
										children: "Streams"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-3.5 px-4",
										children: "Released"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-3.5 px-4 text-right",
										children: "Actions"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "divide-y divide-white/5 text-xs text-fg",
								children: tracks.map((t) => {
									const isCurrent = currentTrack?.id === t.id;
									const isPlaying = isCurrent && isPlayerPlaying;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "hover:bg-white/5 transition-colors",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-3 px-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "relative group size-10 shrink-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
															src: t.coverArtUrl,
															alt: t.title,
															title: t.title,
															className: "size-10 rounded-lg object-cover"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => {
																if (isCurrent) togglePlay();
																else playTrack({
																	id: t.id,
																	title: t.title,
																	artist: t.artistName || profile?.displayName || "Artist",
																	artwork: t.coverArtUrl,
																	artworkLg: t.coverArtUrl,
																	streamUrl: t.audioUrl,
																	genre: t.genre || void 0,
																	duration: t.duration,
																	kind: "track"
																});
															},
															className: "absolute inset-0 grid place-items-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white",
															children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4 ml-0.5" })
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold text-fg line-clamp-1",
														children: t.title
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-muted line-clamp-1",
														children: t.artistName || profile?.displayName
													})] })]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "py-3 px-4 text-muted",
												children: [
													t.genre || "General",
													" ",
													t.mood ? `• ${t.mood}` : ""
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-3 px-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${t.status === "published" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : t.status === "draft" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-1.5 rounded-full ${t.status === "published" ? "bg-emerald-400" : "bg-amber-400"}` }), t.status]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-3 px-4 font-medium text-fg",
												children: t.playCount.toLocaleString()
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-3 px-4 text-muted",
												children: new Date(t.createdAt).toLocaleDateString()
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-3 px-4 text-right",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => void handleDelete(t.id, t.title),
													className: "p-1.5 text-muted hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10",
													title: "Delete Track",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
												})
											})
										]
									}, t.id);
								})
							})]
						})
					})
				})]
			})
		]
	});
}
//#endregion
export { ArtistStudioPage as component };
