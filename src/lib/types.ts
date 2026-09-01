export type TrackKind = "track" | "radio";

export type Track = {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  artwork: string | null;
  artworkLg: string | null;
  duration: number;
  streamUrl: string;
  genre?: string;
  mood?: string;
  description?: string;
  lyrics?: string;
  playCount?: number;
  kind: TrackKind;
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  artwork: string | null;
  artworkLg: string | null;
  trackCount: number;
  isAlbum: boolean;
  owner?: string;
  ownerId?: string;
  tracks?: Track[];
};

export type Artist = {
  id: string;
  name: string;
  handle?: string;
  bio?: string;
  artwork: string | null;
  artworkLg: string | null;
  followerCount?: number;
  trackCount?: number;
};

export type RadioStation = {
  id: string;
  name: string;
  artwork: string | null;
  streamUrl: string;
  tags: string;
  country: string;
  bitrate?: number;
};

export type UserPlaylist = {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
};

export type RepeatMode = "off" | "all" | "one";

export type GenreDef = {
  slug: string;
  api: string;
  label: string;
  hint: string;
  image?: string;
};
