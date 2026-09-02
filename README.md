# Sonara — Dark, Cinematic Music Streaming & Artist Studio

Sonara is a modern, high-fidelity music streaming application and independent artist platform built with React 19, TanStack Start, Tailwind CSS, Better Auth, and Neon PostgreSQL.

---

## Features

- **Cinematic Audio Player**: High-definition playback engine, dynamic color extraction glowing background, visualizer, live stream support, sleep timer, and custom speed control.
- **Global Music Discovery**: Explore trending tracks, genres, moods, curated mixes, and global live radio stations.
- **Artist Studio**: Upload songs, manage releases, customize artist profile, and track real-time stream telemetry.
- **Personal Library**: Manage playlists, favorite tracks, and listening history.
- **Authentication**: Seamless Google OAuth and credential login powered by Better Auth.
- **Responsive Design**: Designed with frosted glass aesthetics, smooth animations, and optimized for mobile, tablet, and desktop screens.

---

## Tech Stack

- **Framework**: TanStack Start (Nitro SSR)
- **UI & Styling**: React 19, Tailwind CSS v4, Radix UI, Lucide Icons, Sonner
- **State Management**: Zustand
- **Database**: PostgreSQL (Neon Serverless)
- **Authentication**: Better Auth (Google OAuth + Email/Password)
- **Deployment**: Vercel

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local` with the following:
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:8080
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## Author

Created with ❤️ by **Jiko**.
