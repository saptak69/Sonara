import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { Music, Sparkles, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="w-full pb-20 animate-in fade-in duration-500">
      {/* Hero Header */}
      <section className="relative w-full h-[45vh] min-h-[350px] flex flex-col justify-end p-8 md:p-12 overflow-hidden bg-surface group">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c0d0a] via-[#3d130f] to-[#ff4a3a] opacity-80" />
          <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-bg to-transparent opacity-60" />
          <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-bg to-transparent" />
          
          <div className="absolute top-1/4 right-1/4 size-[40vw] bg-[#ff6a3a] rounded-full blur-[120px] mix-blend-screen opacity-40 animate-pulse duration-10000" />
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          <p className="text-accent text-sm font-semibold tracking-[0.2em] uppercase mb-3 animate-in slide-in-from-bottom-4 fade-in duration-700">
            About Us
          </p>
          <h1 className="font-display text-5xl md:text-7xl text-white font-medium leading-[1.1] tracking-tight mb-6 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150 fill-mode-both">
            Building a warmer tomorrow, one song at a time.
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-4 md:px-8 max-w-4xl mx-auto mt-16 space-y-16">
        <section className="space-y-6">
          <h2 className="font-display text-3xl text-white">Our Mission</h2>
          <p className="text-lg text-muted leading-relaxed">
            Sonara was built with a simple idea: music is the most powerful time machine we have. 
            We wanted to create a player that feels less like a spreadsheet of files, and more like a carefully curated vinyl collection in a warm, dimly lit room.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl sonara-glass shadow-xl hover:border-accent/30 transition-colors group">
            <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Music className="size-6 text-accent" />
            </div>
            <h3 className="font-display text-xl text-white mb-3">Pristine Audio</h3>
            <p className="text-muted leading-relaxed">
              Experience gapless playback and intelligent caching. We've engineered our audio engine to ensure that your music never stops, smoothly transitioning between your favorite tracks.
            </p>
          </div>

          <div className="p-8 rounded-2xl sonara-glass shadow-xl hover:border-accent/30 transition-colors group">
            <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="size-6 text-accent" />
            </div>
            <h3 className="font-display text-xl text-white mb-3">Immersive Design</h3>
            <p className="text-muted leading-relaxed">
              Every pixel is crafted to bring warmth to your screen. From the fluid animations to the deep sunset glows, Sonara is designed to be a visual treat.
            </p>
          </div>
        </section>

        <section className="space-y-6 p-8 md:p-12 rounded-2xl sonara-glass-strong text-center">
          <Heart className="size-12 text-accent mx-auto mb-6 opacity-80" />
          <h2 className="font-display text-3xl text-white">Crafted for You</h2>
          <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            Whether you are discovering new independent artists or revisiting old classics, we hope Sonara brings a little more warmth into your everyday life.
          </p>
        </section>
      </div>

      <div className="mt-24 border-t border-border/50 pt-8 px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
