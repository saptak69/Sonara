import { Link } from "@tanstack/react-router";
import { ExternalLink, Heart, Music, Shield, Sparkles } from "lucide-react";
import { SonaraIcon } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-2xl py-12 px-4 sm:px-8 text-muted">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SonaraIcon size={32} />
            <div>
              <span className="text-lg font-bold text-fg tracking-tight">Sonara</span>
              <p className="text-xs text-muted/80">
                An experimental music discovery and streaming platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <Link to="/" className="hover:text-fg transition-colors">
              Home
            </Link>
            <Link to="/explore" className="hover:text-fg transition-colors">
              Explore
            </Link>
            <Link to="/radio" className="hover:text-fg transition-colors">
              Radio
            </Link>
            <Link to="/studio" className="hover:text-fg transition-colors">
              Artist Studio
            </Link>
            <Link to="/library" className="hover:text-fg transition-colors">
              Library
            </Link>
            <Link
              to="/about"
              className="text-accent hover:text-accent/80 font-medium transition-colors flex items-center gap-1"
            >
              <Sparkles className="size-3" />
              About & Legal
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/[0.06] text-xs text-subtle leading-relaxed">
          <div>
            <p className="font-semibold text-fg/80 mb-1 flex items-center gap-1.5">
              <Music className="size-3.5 text-accent" />
              Experimental Technology
            </p>
            <p>
              Built for research, software engineering experimentation, and modern web audio architecture. No claim of ownership over third-party music or intellectual property.
            </p>
          </div>

          <div>
            <p className="font-semibold text-fg/80 mb-1 flex items-center gap-1.5">
              <Shield className="size-3.5 text-emerald-400" />
              Rights & Intellectual Property
            </p>
            <p>
              All tracks, logos, and artwork belong to their respective copyright holders. Review our licensing notices and takedown procedure on our{" "}
              <Link to="/about" className="text-accent underline underline-offset-2 hover:text-accent/80">
                About page
              </Link>
              .
            </p>
          </div>

          <div>
            <p className="font-semibold text-fg/80 mb-1 flex items-center gap-1.5">
              <Heart className="size-3.5 text-rose-500 fill-rose-500/20" />
              Meet the Developer
            </p>
            <p>
              Engineered by{" "}
              <a
                href="https://saptak-mondal-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg font-medium hover:text-accent transition-colors inline-flex items-center gap-0.5"
              >
                Saptak Mondal
                <ExternalLink className="size-3" />
              </a>
              . Exploring the convergence of distributed systems, web audio, and product design.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06] text-[11px] text-subtle">
          <p>© {new Date().getFullYear()} Sonara. Independent non-commercial experiment.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-muted transition-colors">
              Terms & Attribution
            </Link>
            <span>•</span>
            <Link to="/about" className="hover:text-muted transition-colors">
              Copyright Notice
            </Link>
            <span>•</span>
            <a
              href="https://saptak-mondal-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted transition-colors inline-flex items-center gap-1"
            >
              Developer Portfolio
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
