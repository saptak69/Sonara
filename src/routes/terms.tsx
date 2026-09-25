import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:px-8 space-y-8 stagger-in pb-32">
      <header className="border-b border-white/10 pb-6 mb-8 mt-8 md:mt-0">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-fg">Terms of Service</h1>
        <p className="mt-4 text-muted">Last updated: September 2026</p>
      </header>
      
      <div className="prose prose-invert max-w-none text-muted space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-fg">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Sonara, you agree to be bound by these Terms of Service. If you do not
            agree to all the terms and conditions, you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg">2. Description of Service</h2>
          <p>
            Sonara is a free music streaming application that aggregates publicly available audio content
            and metadata. We do not host or upload any copyrighted music files on our servers. All audio
            streams are provided by third-party platforms and APIs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg">3. User Conduct</h2>
          <p>
            You agree to use Sonara only for lawful purposes. You must not use the service in any way that
            causes, or may cause, damage to the service or impairment of the availability or accessibility
            of the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg">4. Intellectual Property</h2>
          <p>
            The Sonara application, including its original code, design, and features, is owned by Sonara
            and is protected by international copyright, trademark, and other intellectual property laws.
            The music content streamed through the app remains the property of their respective copyright holders.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg">5. Limitation of Liability</h2>
          <p>
            In no event shall Sonara, nor its directors, employees, or partners, be liable for any indirect,
            incidental, special, consequential or punitive damages resulting from your use of the service or
            any content provided within the app.
          </p>
        </section>
      </div>
    </div>
  );
}
