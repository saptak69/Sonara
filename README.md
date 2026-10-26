# Sonara

Music streaming, live radio and a studio for independent artists. One codebase
runs as a website, an Android app and an Android TV app.

## What's in it

- **Player** — gapless playback, equalizer, lyrics, queue, sleep timer, offline downloads.
- **Discovery** — trending songs, curated playlists, genre and mood pages, live radio,
  a weekly mix and a "Discovery Station" of songs you haven't heard yet.
- **Your library** — liked songs, playlists and listening history, synced to your account
  so they follow you between phone, desktop and TV. Edits made offline are queued and
  sent when you're back online.
- **Artist Studio** — upload songs, manage an artist profile and see play counts.
- **Android TV** — appears on the TV home screen, fully usable with a remote
  (D-pad navigation, media keys, Back button), with large focus highlights.

## Tech

| Area | Choice |
| --- | --- |
| App framework | TanStack Start (React 19, file-based routes, server functions) |
| Styling | Tailwind CSS v4 — design tokens live at the top of `src/styles.css` |
| State | Zustand (`src/lib/player-store.ts`) |
| Database | Neon Postgres in production, embedded PGLite for local development |
| Auth | Better Auth — Google (web + native Android) and email/password |
| Android | Capacitor 8 shell that loads the deployed site |
| Hosting | Vercel |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://localhost:8080
```

Without `DATABASE_URL` the app uses a local PGLite database, so it runs with no setup.

### Environment variables

| Name | Needed for |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon). Migrations run on `npm run build`. |
| `BETTER_AUTH_SECRET` | Signing sessions. Any long random string; keep it stable. |
| `BETTER_AUTH_URL` | Public URL of the site, e.g. `https://sonara-murex.vercel.app`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in on the web. The redirect URI to register in Google Cloud is `<site>/api/auth/callback/google`. |

## Project layout

```
src/
  routes/            pages (file-based) and API routes under routes/api
  components/
    shell/           sidebar, side rail, bottom tabs, top bar, account menu
    player/          audio engine, mini player, full-screen player, queue, lyrics, EQ
  lib/
    auth/            Better Auth server + client helpers
    library-service.ts   server functions for playlists, likes, history, settings
    library-sync.ts      keeps the local library and the account in step
    player-store.ts      playback + library state
    tv.ts                remote-control navigation for Android TV
migrations/          SQL, applied in order and recorded in _migrations
android/             Capacitor Android project
```

### Layouts

The shell switches between three layouts in CSS (custom variants in `styles.css`):

- **default** — phone held upright: top bar, bottom tabs, mini player.
- **`short:`** — phone in landscape and Android TV: side rail, compact mini player.
- **`desk:`** — tablets in landscape and desktops: sidebar, search bar, floating player.

`tv:` styles apply while a remote or keyboard arrows are in use.

## Android

```bash
npm run android:sync          # copy config/plugins into android/
# then open android/ in Android Studio, or:
cd android && ./gradlew assembleRelease
```

The app loads the live site (`server.url` in `capacitor.config.ts`), so most changes
ship by deploying the website. Rebuild the APK when you change native config,
plugins or the manifest.

To try it on a TV: install the APK on an Android TV / Google TV device or emulator
(`adb install app-release.apk`). Sonara shows up in the apps row using
`res/drawable-xhdpi/tv_banner.png`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build, then database migrations |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |

Made by Jiko.

## Branding

Sonara has **one logo**: the "S" mark. The master artwork is `assets/icon.png`; everything else is generated from it
(`public/brand/*`, `public/favicon.ico`, the Android TV banner, the PWA and launcher icons). Do not redraw it.

| Use | Where |
| --- | --- |
| **Mark only** (`<Logo variant="mark" />`) | Square or tight spots: phone header, compact side rail, favicon, app icon, loading states |
| **Mark + "sonara" wordmark** (`<Logo variant="full" />`) | Wide brand spots: desktop sidebar, login / sign-up, footer, share card (`public/brand/og.png`), Android TV banner |

The component lives in `src/components/logo.tsx`.
