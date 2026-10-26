-- Library sync: stable ids from the client, no duplicate tracks, per-user settings.

-- A track can only appear once per playlist. Remove existing duplicates first,
-- keeping the earliest copy.
delete from "playlist_track" a
  using "playlist_track" b
  where a.playlist_id = b.playlist_id
    and a.track_id = b.track_id
    and (a.added_at, a.id) > (b.added_at, b.id);

create unique index if not exists "playlist_track_playlist_track_unique"
  on "playlist_track" ("playlist_id", "track_id");

-- Liked songs ordering (newest first) and fast "recently played" lookups.
create index if not exists "user_favorite_user_created_idx"
  on "user_favorite" ("user_id", "created_at" desc);
create index if not exists "user_play_history_user_played_idx"
  on "user_play_history" ("user_id", "played_at" desc);

-- Playback preferences (equalizer, autoplay, …) that follow the user between devices.
create table if not exists "user_settings" (
  "user_id" text not null primary key references "user" ("id") on delete cascade,
  "settings" jsonb not null default '{}'::jsonb,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null
);
