import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { Music, Sparkles, Heart, Shield, FileText } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="w-full pb-20 animate-in fade-in duration-500 bg-bg selection:bg-accent/30 text-fg">
      {/* Hero Header */}
      <section className="relative w-full h-[45vh] min-h-[350px] flex flex-col justify-end p-8 md:p-12 overflow-hidden bg-black border-b border-border/50 group">
        {/* Fluid Mesh Gradient Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
          <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] bg-accent/30 rounded-full blur-[100px] mix-blend-screen animate-[spin_20s_linear_infinite]" style={{ transformOrigin: 'center right' }} />
          <div className="absolute top-[10%] -right-[20%] w-[70vw] h-[70vw] bg-orange-500/20 rounded-full blur-[120px] mix-blend-screen animate-[spin_25s_linear_infinite_reverse]" style={{ transformOrigin: 'center left' }} />
          <div className="absolute -bottom-[30%] left-[20%] w-[80vw] h-[80vw] bg-rose-600/20 rounded-full blur-[140px] mix-blend-screen animate-[spin_30s_linear_infinite]" style={{ transformOrigin: 'top center' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-semibold uppercase tracking-widest mb-6">
            About Sonara
          </div>
          <h1 className="text-5xl md:text-7xl text-white font-bold tracking-tighter leading-[1.1] mb-6 text-balance">
            Building the next generation of audio.
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-4 md:px-8 max-w-4xl mx-auto mt-16 space-y-24">
        {/* Mission */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tighter text-white">Our Mission</h2>
          <p className="text-lg md:text-xl text-muted leading-relaxed max-w-[55ch]">
            Sonara was built with a simple idea: music streaming shouldn't feel like navigating a spreadsheet. 
            We wanted to create a player that brings back the intentionality of a curated vinyl collection, built entirely on modern web technologies.
          </p>
        </section>

        {/* Features */}
        <section className="grid sm:grid-cols-2 gap-8">
          <div className="p-8 rounded-[24px] sonara-glass-light hover:border-white/20 transition-colors group">
            <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Music className="size-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-3">Pristine Audio</h3>
            <p className="text-muted leading-relaxed">
              Experience seamless playback and intelligent caching. We've engineered our audio engine to ensure that your music never stops, smoothly transitioning between your favorite tracks.
            </p>
          </div>

          <div className="p-8 rounded-[24px] sonara-glass-light hover:border-white/20 transition-colors group">
            <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="size-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-3">Immersive Design</h3>
            <p className="text-muted leading-relaxed">
              Every pixel is crafted to bring focus back to the artwork and the artist. From fluid animations to pure monochrome contrast, Sonara is designed to be a visual treat.
            </p>
          </div>
        </section>

        <hr className="border-border/50" />

        {/* Legal / Subsections */}
        <section className="space-y-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tighter text-white mb-8">Legal & Privacy</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Privacy Policy */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white mb-2">
                  <Shield className="size-5 text-accent" />
                  <h3 className="text-xl font-bold tracking-tight">Privacy Policy</h3>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  We respect your privacy. Sonara does not sell your personal data. Analytics are collected anonymously to improve app performance and stability. Any authentication data is securely handled via industry-standard protocols.
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  By using Sonara, you consent to our use of essential cookies and local storage to keep you logged in and preserve your playback preferences.
                </p>
              </div>
              
              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white mb-2">
                  <FileText className="size-5 text-accent" />
                  <h3 className="text-xl font-bold tracking-tight">Terms of Service</h3>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  Sonara is provided "as is" without warranties of any kind. You agree to use the service for personal, non-commercial entertainment purposes only. 
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  We reserve the right to modify or discontinue the service at any time. Music metadata and streaming functionality are subject to availability and third-party API restrictions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-24 border-t border-border/50 pt-8 px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
