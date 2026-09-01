import type { GenreDef } from "./types";

export const GENRES: GenreDef[] = [
  {
    slug: "electronic",
    api: "Electronic",
    label: "Electronic",
    hint: "Pulse and night drive",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "house",
    api: "House",
    label: "House",
    hint: "Four on the floor",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "lofi",
    api: "Lo-Fi",
    label: "Lo-Fi",
    hint: "Soft edges, late hours",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "hip-hop",
    api: "Hip-Hop/Rap",
    label: "Hip-Hop",
    hint: "Bars and boom-bap",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "rnb",
    api: "R&B/Soul",
    label: "R&B",
    hint: "Velvet and late light",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "pop",
    api: "Pop",
    label: "Pop",
    hint: "Hooks that stay",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "rock",
    api: "Rock",
    label: "Rock",
    hint: "Grit and gain",
    image: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "ambient",
    api: "Ambient",
    label: "Ambient",
    hint: "Air and afterglow",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "jazz",
    api: "Jazz",
    label: "Jazz",
    hint: "Smoke and swing",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "techno",
    api: "Techno",
    label: "Techno",
    hint: "Steel and strobe",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "trap",
    api: "Trap",
    label: "Trap",
    hint: "808s and haze",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
  },
  {
    slug: "indie",
    api: "Alternative",
    label: "Alternative",
    hint: "Off the main stage",
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&auto=format&fit=crop&q=80",
  },
];

export const MOODS = [
  {
    id: "chill",
    query: "chill lofi",
    label: "Chill",
    subtitle: "Lo-Fi & Relax",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "focus",
    query: "focus ambient",
    label: "Focus",
    subtitle: "Deep Flow",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "energy",
    query: "workout electronic",
    label: "Energy",
    subtitle: "High Tempo",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "late",
    query: "late night rnb",
    label: "Late Night",
    subtitle: "Midnight Drive",
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "party",
    query: "party house",
    label: "Party",
    subtitle: "Club & Beats",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sad",
    query: "sad indie",
    label: "Melancholy",
    subtitle: "Quiet Hours",
    image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "romance",
    query: "romantic soul",
    label: "Romance",
    subtitle: "Warm Soul",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "commute",
    query: "driving synth",
    label: "Commute",
    subtitle: "Highway Lights",
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80",
  },
] as const;

export function genreBySlug(slug: string): GenreDef | undefined {
  return GENRES.find((g) => g.slug === slug);
}
