import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:px-8 space-y-8 stagger-in pb-32">
      <header className="border-b border-white/10 pb-6 mb-8 mt-8 md:mt-0">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-fg">Privacy Policy</h1>
        <p className="mt-4 text-muted">Last updated: September 2026</p>
      </header>
      
      <div className="prose prose-invert max-w-none text-muted space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-fg">1. Information We Collect</h2>
          <p>
            When you use Sonara, we may collect information about you, including your account details,
            listening history, favorite tracks, created playlists, and usage data to improve your experience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services. This includes
            personalizing your music recommendations, syncing your library across devices, and understanding
            how users interact with our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg">3. Third-Party Services</h2>
          <p>
            Sonara integrates with third-party APIs (such as Saavn and Last.fm) to fetch music metadata, lyrics,
            and artist information. Your search queries and listening activity may be processed through these
            external services to fulfill your requests.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg">4. Data Security</h2>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse, and
            unauthorized access. However, no security system is impenetrable, and we cannot guarantee the
            absolute security of your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@sonara.app.
          </p>
        </section>
      </div>
    </div>
  );
}
