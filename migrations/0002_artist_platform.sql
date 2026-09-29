-- Artist Profile, Uploaded Tracks Catalog, and Anti-Spam Play Metrics

create table if not exists "artist_profile" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "display_name" text not null,
  "handle" text not null unique,
  "bio" text,
  "avatar_url" text,
  "banner_url" text,
  "verified" boolean default false not null,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null
);

create table if not exists "uploaded_tracks" (
  "id" text not null primary key,
  "artist_id" text not null references "artist_profile" ("id") on delete cascade,
  "user_id" text not null references "user" ("id") on delete cascade,
  "title" text not null,
  "genre" text,
  "mood" text,
  "description" text,
  "lyrics" text,
  "cover_art_url" text,
  "audio_url" text not null,
  "storage_key" text not null,
  "duration" integer default 0 not null,
  "file_size" integer default 0 not null,
  "mime_type" text,
  "play_count" integer default 0 not null,
  "status" text default 'published' not null,
  "rights_confirmed_at" timestamptz default CURRENT_TIMESTAMP not null,
  "rights_confirmation_version" text default 'v1' not null,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "published_at" timestamptz default CURRENT_TIMESTAMP,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null,
  "deleted_at" timestamptz
);

create table if not exists "track_plays" (
  "id" text not null primary key,
  "track_id" text not null references "uploaded_tracks" ("id") on delete cascade,
  "user_id" text references "user" ("id") on delete set null,
  "session_id" text not null,
  "played_at" timestamptz default CURRENT_TIMESTAMP not null,
  "duration_played" integer not null
);

create index if not exists "artist_profile_user_id_idx" on "artist_profile" ("user_id");
create index if not exists "artist_profile_handle_idx" on "artist_profile" ("handle");
create index if not exists "uploaded_tracks_artist_id_idx" on "uploaded_tracks" ("artist_id");
create index if not exists "uploaded_tracks_user_id_idx" on "uploaded_tracks" ("user_id");
create index if not exists "uploaded_tracks_status_idx" on "uploaded_tracks" ("status");
create index if not exists "uploaded_tracks_created_at_idx" on "uploaded_tracks" ("created_at" desc);
create index if not exists "track_plays_track_session_idx" on "track_plays" ("track_id", "session_id");
