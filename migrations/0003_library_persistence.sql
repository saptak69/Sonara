-- User Playlists, Playlist Tracks, User Favorites, and User Play History

create table if not exists "user_playlist" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "name" text not null,
  "description" text,
  "cover_art_url" text,
  "is_public" boolean default false not null,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null
);

create table if not exists "playlist_track" (
  "id" text not null primary key,
  "playlist_id" text not null references "user_playlist" ("id") on delete cascade,
  "track_id" text not null,
  "title" text not null,
  "artist" text not null,
  "artwork" text,
  "artwork_lg" text,
  "duration" integer default 0 not null,
  "stream_url" text not null,
  "genre" text,
  "position" integer default 0 not null,
  "added_at" timestamptz default CURRENT_TIMESTAMP not null
);

create table if not exists "user_favorite" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "track_id" text not null,
  "title" text not null,
  "artist" text not null,
  "artwork" text,
  "artwork_lg" text,
  "duration" integer default 0 not null,
  "stream_url" text not null,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  constraint "user_favorite_user_track_unique" unique ("user_id", "track_id")
);

create table if not exists "user_play_history" (
  "id" text not null primary key,
  "user_id" text references "user" ("id") on delete set null,
  "session_id" text not null,
  "track_id" text not null,
  "title" text not null,
  "artist" text not null,
  "artwork" text,
  "artwork_lg" text,
  "duration" integer default 0 not null,
  "stream_url" text not null,
  "played_at" timestamptz default CURRENT_TIMESTAMP not null
);

create index if not exists "user_playlist_user_id_idx" on "user_playlist" ("user_id");
create index if not exists "playlist_track_playlist_id_idx" on "playlist_track" ("playlist_id");
create index if not exists "playlist_track_position_idx" on "playlist_track" ("playlist_id", "position");
create index if not exists "user_favorite_user_id_idx" on "user_favorite" ("user_id");
create index if not exists "user_play_history_user_id_idx" on "user_play_history" ("user_id");
create index if not exists "user_play_history_session_id_idx" on "user_play_history" ("session_id");
create index if not exists "user_play_history_played_at_idx" on "user_play_history" ("played_at" desc);
