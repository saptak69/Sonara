import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AppShell } from "@/components/app-shell";
import { PushNotificationsSetup } from "@/components/push-notifications";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/lib/query-provider";
import appCss from "../styles.css?url";

const TITLE = "Sonara — music, radio & independent artists";
const DESCRIPTION = "Stream songs, live radio and new music from independent artists. Free, fast and beautiful on phone, desktop and TV.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "theme-color", content: "#0A0908" },
      { name: "color-scheme", content: "dark" },
      { property: "og:title", content: "Sonara" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: "/sonara-logo-v2.png" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", href: "/sonara-logo-v2.png" },
      { rel: "apple-touch-icon", href: "/sonara-logo-v2.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <ServiceWorkerRegister />
        <PushNotificationsSetup />
        <QueryProvider>
          <TooltipProvider delayDuration={200} skipDelayDuration={100}>
            <AppShell>
              <Outlet />
            </AppShell>
          </TooltipProvider>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
        <Scripts />
      </body>
    </html>
  );
}
