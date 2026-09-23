import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { PushNotificationsSetup } from "@/components/push-notifications";
import { QueryProvider } from "@/lib/query-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import appCss from "../styles.css?url";

const APP_NAME = "Sonara Music";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Sonara" },
      { name: "description", content: "Free Music Streaming App" },
      { name: "theme-color", content: "var(--color-bg)" },
      { property: "og:title", content: "Sonara" },
      { property: "og:description", content: "Free Music Streaming App" },
      { property: "og:image", content: "/sonara-logo-v2.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/sonara-logo-v2.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/sonara-logo-v2.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg" style={{ backgroundColor: "#070302", color: "#fcfaf9" }}>
        <PreviewHostBridge />
        <PushNotificationsSetup />
        <AuthProvider>
          <QueryProvider>
            <TooltipProvider delayDuration={200} skipDelayDuration={100}>
              <AppShell>
                <Outlet />
              </AppShell>
            </TooltipProvider>
          </QueryProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
        <Scripts />
      </body>
    </html>
  ),
});
