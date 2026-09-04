import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Code2,
  ExternalLink,
  Flame,
  Globe,
  Guitar,
  Heart,
  HelpCircle,
  Layers,
  Mail,
  Music,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  User,
  Zap,
} from "lucide-react";
import { SonaraIcon } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const contactEmail = "saptakmondal.official@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopiedEmail(true);
    toast.success("Email address copied to clipboard");
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Standardized frosted glass matching the rest of Sonara:
  // Clean, luminous frosted glass (no black tint) with uniform backdrop blur, subtle highlight border, and soft elevation
  const frostedGlass =
    "rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-2xl shadow-xl hover:border-white/20 transition-all";
  const nestedSlab =
    "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-sm";

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8 max-w-5xl mx-auto space-y-16 animate-in fade-in duration-300">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/[0.04] to-white/[0.01] p-8 sm:p-12 backdrop-blur-3xl shadow-2xl">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-rose-900/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-semibold tracking-wide uppercase shadow-sm">
              <Sparkles className="size-3.5" />
              Experimental Music Technology Project
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              About <span className="bg-gradient-to-r from-white via-white/90 to-accent bg-clip-text text-transparent">Sonara</span>
            </h1>

            <p className="text-sm sm:text-base text-muted/95 leading-relaxed">
              Sonara is an independent experimental software platform built to explore the boundaries of modern web engineering, real-time audio streaming, distributed architecture, and music discovery.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl text-fg/90">
                <Code2 className="size-3.5 text-accent" />
                React & Vite
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl text-fg/90">
                <Zap className="size-3.5 text-amber-400" />
                High-Performance Caching
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl text-fg/90">
                <Shield className="size-3.5 text-emerald-400" />
                Educational & Non-Commercial
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-xl">
            <SonaraIcon size={84} />
            <span className="mt-3 text-sm font-semibold tracking-wider text-fg/90">SONARA AUDIO</span>
            <span className="text-[11px] text-muted">Experimental Engine</span>
          </div>
        </div>
      </section>

      {/* Meet the Developer Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider">
              <User className="size-3.5" />
              Creator Spotlight
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Meet the Developer
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Built by Saptak Mondal — Software Engineer & Creative Technologist
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-xs font-medium text-muted hidden sm:inline-block">
            Independent Builder
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Developer Bio Card */}
          <div className={`lg:col-span-2 ${frostedGlass} p-6 sm:p-8 space-y-6`}>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-fg flex items-center gap-2">
                <Flame className="size-5 text-accent" />
                Hi, I'm Saptak Mondal
              </h3>
              <p className="text-sm text-fg/95 leading-relaxed">
                I'm a full-stack software engineer and Computer Science graduate who enjoys building things that sit somewhere between engineering, design, and curiosity.
              </p>
              <p className="text-sm text-muted/95 leading-relaxed">
                Sonara started as one of those experiments. I wanted to explore what it would take to build a modern music platform from the ground up — from search and discovery to audio streaming, artist profiles, curated albums, personal libraries, creator uploads, backend infrastructure, distributed caching, and everything in between.
              </p>
              <p className="text-sm text-muted/95 leading-relaxed">
                What started as an experiment gradually turned into a surprisingly large engineering journey.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="text-sm font-semibold text-fg flex items-center gap-2">
                <Terminal className="size-4 text-emerald-400" />
                Why I Built Sonara
              </h4>
              <p className="text-sm text-muted/95 leading-relaxed">
                I build projects primarily to learn by actually building them. With Sonara, I wanted to experiment with things that don't always fit neatly into a college syllabus: distributed systems, serverless architecture, real-time applications, API integration, LRU in-memory caching, relational databases, media handling, secure authentication, and product design.
              </p>
              <div className={`${nestedSlab} p-4 text-xs text-fg/90 italic leading-relaxed`}>
                "There was never a single grand plan behind it. It was more: 'What happens if I try to build this?' So I built it. Then I broke it. Then I fixed it. Then I found another problem, and built around that too. That is essentially how Sonara came to exist."
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="text-sm font-semibold text-fg flex items-center gap-2">
                <Guitar className="size-4 text-amber-400" />
                Engineering × Creativity
              </h4>
              <p className="text-sm text-muted/95 leading-relaxed">
                My approach to software is heavily influenced by the things I enjoy outside of programming. I'm particularly interested in backend architecture, concurrency, WebSockets, databases, and building interfaces that feel effortless to use.
              </p>
              <p className="text-sm text-muted/95 leading-relaxed">
                I'm also a guitarist and a huge fan of progressive rock and metal. That probably explains why I enjoy both engineering systems and ridiculously complicated guitar riffs. For me, there's something strangely similar about designing a reliable distributed system and arranging music in odd time signatures: <strong className="text-fg font-medium">structure matters, details matter, and everything has to work together.</strong>
              </p>
            </div>
          </div>

          {/* Portfolio & Contact Sidebar Card */}
          <div className={`${frostedGlass} p-6 sm:p-7 flex flex-col justify-between gap-6`}>
            <div className="space-y-4">
              <div className="size-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-lg shadow-accent/15">
                <Code2 className="size-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Saptak Mondal
                </h3>
                <p className="text-xs text-accent font-medium mt-0.5">
                  Creative Technologist & Software Engineer
                </p>
              </div>

              <p className="text-xs text-muted/95 leading-relaxed">
                Beyond Sonara, I enjoy building full-stack products, exploring emerging technologies, experimenting with interactive interfaces, and occasionally going far deeper into technical rabbit holes than originally anticipated.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-fg/90">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  Full-Stack Architecture & APIs
                </div>
                <div className="flex items-center gap-2 text-xs text-fg/90">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  Distributed Systems & Performance
                </div>
                <div className="flex items-center gap-2 text-xs text-fg/90">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  Modern Web Audio & Real-time UIs
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <a
                href="https://saptak-mondal-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs tracking-wide shadow-lg shadow-accent/25 transition-all group active:scale-95"
              >
                <span>Visit My Portfolio</span>
                <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-fg text-xs font-medium border border-white/15 backdrop-blur-xl transition-all active:scale-95 shadow-sm"
              >
                <Mail className="size-3.5 text-accent" />
                <span>{copiedEmail ? "Copied Email!" : "Get In Touch"}</span>
              </button>

              <p className="text-[11px] text-center text-subtle font-mono truncate">
                {contactEmail}
              </p>
            </div>
          </div>
        </div>

        {/* A Small Note */}
        <div className={`${frostedGlass} p-6 sm:p-7 text-xs text-muted/95 leading-relaxed space-y-2.5`}>
          <p className="font-semibold text-fg text-sm flex items-center gap-1.5">
            <Heart className="size-4 text-rose-500 fill-rose-500/20" />
            A Small Note
          </p>
          <p>
            Sonara is an independently built experimental project. It isn't backed by a large team, a giant engineering department, or a room full of people named Alex. It is mostly just me, a computer, an unreasonable number of browser tabs, and a tendency to keep building things until they work.
          </p>
          <p>
            If you find a bug, have an idea, or simply want to talk about software engineering and music, I'd genuinely love to hear from you. Thanks for trying Sonara.
          </p>
          <p className="text-fg font-medium pt-1">— Saptak</p>
        </div>
      </section>

      {/* Purpose & Core Capabilities */}
      <section className="space-y-6">
        <div className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider">
            <Layers className="size-3.5" />
            Project Architecture
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Platform Capabilities & Purpose
          </h2>
          <p className="text-xs text-muted mt-0.5">
            The primary purpose of Sonara is education, research, experimentation, and software development.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${frostedGlass} p-5 sm:p-6 space-y-3`}>
            <div className="size-10 rounded-xl bg-red-500/15 border border-red-500/25 text-accent flex items-center justify-center shadow-inner">
              <Music className="size-4.5" />
            </div>
            <h3 className="text-sm font-bold text-fg">Audio Streaming</h3>
            <p className="text-xs text-muted/95 leading-relaxed">
              Multi-bitrate stream decryption, Web Audio API analysis, and custom player bar with seamless queue management.
            </p>
          </div>

          <div className={`${frostedGlass} p-5 sm:p-6 space-y-3`}>
            <div className="size-10 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center shadow-inner">
              <Globe className="size-4.5" />
            </div>
            <h3 className="text-sm font-bold text-fg">Universal Discovery</h3>
            <p className="text-xs text-muted/95 leading-relaxed">
              Real-time multi-provider search autocomplete, artist discography indexing, and live radio station directory.
            </p>
          </div>

          <div className={`${frostedGlass} p-5 sm:p-6 space-y-3`}>
            <div className="size-10 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center shadow-inner">
              <Zap className="size-4.5" />
            </div>
            <h3 className="text-sm font-bold text-fg">Caching & Resilience</h3>
            <p className="text-xs text-muted/95 leading-relaxed">
              In-memory server cache with in-flight deduplication, sub-millisecond response times, and pooled DB retries.
            </p>
          </div>

          <div className={`${frostedGlass} p-5 sm:p-6 space-y-3`}>
            <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shadow-inner">
              <User className="size-4.5" />
            </div>
            <h3 className="text-sm font-bold text-fg">Creator Studio</h3>
            <p className="text-xs text-muted/95 leading-relaxed">
              Independent artist tools for music publication, custom artwork uploading, play telemetry, and library management.
            </p>
          </div>
        </div>
      </section>

      {/* Third-Party Content & Licensing Disclaimers */}
      <section className="space-y-6">
        <div className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider">
            <Shield className="size-3.5" />
            Legal & Licensing Notices
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Third-Party Services, Content & Intellectual Property
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Transparency regarding APIs, content providers, and intellectual property boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Third-Party Services */}
          <div className={`${frostedGlass} p-6 sm:p-8 space-y-4`}>
            <h3 className="text-base font-semibold text-fg flex items-center gap-2">
              <Globe className="size-4 text-accent" />
              Third-Party Services & Content Integrations
            </h3>
            <p className="text-xs text-muted/95 leading-relaxed">
              Some functionality within Sonara uses third-party APIs, public databases, or content services. Depending on availability, Sonara may display or access:
            </p>
            <ul className="text-xs text-muted/95 space-y-1.5 pl-4 list-disc marker:text-accent">
              <li>Music metadata and song titles</li>
              <li>Artist discographies and biographical details</li>
              <li>Album cover art and related imagery</li>
              <li>Public radio directory listings and stream previews</li>
              <li>Search autocomplete suggestions</li>
            </ul>
            <p className="text-xs text-muted/95 leading-relaxed pt-2 border-t border-white/[0.08]">
              Sonara does not represent that it owns any third-party content made accessible through these integrations. All music, sound recordings, artwork, trademarks, artist names, and other intellectual property belong strictly to their respective owners and rights holders.
            </p>
          </div>

          {/* Card 2: Independent Artists */}
          <div className={`${frostedGlass} p-6 sm:p-8 space-y-4`}>
            <h3 className="text-base font-semibold text-fg flex items-center gap-2">
              <Sparkles className="size-4 text-purple-400" />
              Independent Artists & Creator Responsibilities
            </h3>
            <p className="text-xs text-muted/95 leading-relaxed">
              Sonara provides experimental tools that allow independent artists and creators to upload and manage their own music and original artwork.
            </p>
            <p className="text-xs text-muted/95 leading-relaxed">
              By uploading content, users agree and warrant that they possess the necessary rights, permissions, licenses, and authority to make that content available through Sonara.
            </p>
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-xl text-xs text-amber-200 leading-relaxed shadow-inner">
              Users must not upload copyrighted material, sound recordings, commercial releases, artwork, or third-party content for which they lack authorized distribution permissions.
            </div>
          </div>
        </div>

        {/* Copyright & Content Concerns (Reporting Protocol) */}
        <div className={`${frostedGlass} p-6 sm:p-8 space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <ShieldAlert className="size-5 text-accent" />
                Copyright & Content Inquiries
              </h3>
              <p className="text-xs text-muted/95">
                Sonara respects the intellectual property rights of artists, creators, labels, and publishers.
              </p>
            </div>

            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent("Sonara Copyright Inquiry")}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-semibold text-white transition-all shadow-md shadow-accent/25 shrink-0 active:scale-95"
            >
              <Mail className="size-3.5" />
              Submit Rights Notice
            </a>
          </div>

          <p className="text-xs text-muted/95 leading-relaxed">
            If you are a copyright owner or authorized representative and believe that content accessible through Sonara infringes your rights, please provide us with the following details for immediate review:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div className={`${nestedSlab} p-4 text-xs space-y-1`}>
              <span className="font-semibold text-fg">1. Contact Information</span>
              <p className="text-muted/90 text-[11px] leading-relaxed">Your legal name, email address, and company or organization.</p>
            </div>
            <div className={`${nestedSlab} p-4 text-xs space-y-1`}>
              <span className="font-semibold text-fg">2. Copyrighted Work</span>
              <p className="text-muted/90 text-[11px] leading-relaxed">Specific identification and description of the copyrighted material.</p>
            </div>
            <div className={`${nestedSlab} p-4 text-xs space-y-1`}>
              <span className="font-semibold text-fg">3. Content on Sonara</span>
              <p className="text-muted/90 text-[11px] leading-relaxed">Exact track title, artist name, or album as displayed on the platform.</p>
            </div>
            <div className={`${nestedSlab} p-4 text-xs space-y-1`}>
              <span className="font-semibold text-fg">4. Location & URL</span>
              <p className="text-muted/90 text-[11px] leading-relaxed">The specific URL or ID that enables us to locate the material immediately.</p>
            </div>
            <div className={`${nestedSlab} p-4 text-xs space-y-1`}>
              <span className="font-semibold text-fg">5. Statement of Rights</span>
              <p className="text-muted/90 text-[11px] leading-relaxed">A declaration confirming your ownership or authorization to act on behalf of the owner.</p>
            </div>
            <div className={`${nestedSlab} p-4 text-xs space-y-1`}>
              <span className="font-semibold text-fg">6. Supporting Info</span>
              <p className="text-muted/90 text-[11px] leading-relaxed">Any additional documentation or registration details that assist review.</p>
            </div>
          </div>

          <div className="text-xs text-muted/90 pt-3 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
            <span>We review legitimate notices promptly and take appropriate corrective action where required.</span>
            <span className="text-fg font-mono text-[11px] bg-white/5 px-3 py-1 rounded-lg border border-white/10">
              {contactEmail}
            </span>
          </div>
        </div>

        {/* No Ownership Claim & Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${frostedGlass} p-6 sm:p-7 space-y-3 text-xs text-muted/95 leading-relaxed`}>
            <h4 className="font-semibold text-fg text-sm flex items-center gap-1.5">
              <HelpCircle className="size-4 text-blue-400" />
              No Ownership Claim
            </h4>
            <p>
              Nothing on Sonara should be interpreted as an assertion of ownership or control over third-party music, sound recordings, cover art, trademarks, or intellectual property.
            </p>
            <p>
              References to artists, songs, albums, and labels are provided exclusively as part of the functionality of this non-commercial experimental platform and remain associated with their respective rights holders.
            </p>
          </div>

          <div className={`${frostedGlass} p-6 sm:p-7 space-y-3 text-xs text-muted/95 leading-relaxed`}>
            <h4 className="font-semibold text-fg text-sm flex items-center gap-1.5">
              <Shield className="size-4 text-emerald-400" />
              Experimental Nature & Compliance
            </h4>
            <p>
              Sonara is an actively developed software engineering experiment. Features, APIs, data sources, audio resolution methods, and UI modules may change, evolve, or be updated without notice.
            </p>
            <p>
              This notice describes the intended non-commercial nature of the project. Where applicable, Sonara adheres to terms and guidelines governing the services and APIs utilized.
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-xs text-muted">
            Last updated: September 2026
          </span>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

