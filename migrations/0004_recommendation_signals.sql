-- Recommendation and playback telemetry signals
alter table "user_play_history" add column if not exists "duration_played" integer default 0;
alter table "user_play_history" add column if not exists "completed" boolean default false;
alter table "user_play_history" add column if not exists "skipped" boolean default false;
alter table "user_play_history" add column if not exists "early_skip" boolean default false;
alter table "user_play_history" add column if not exists "genre" text;

create index if not exists "user_play_history_track_id_idx" on "user_play_history" ("track_id");
create index if not exists "playlist_track_track_id_idx" on "playlist_track" ("track_id");
