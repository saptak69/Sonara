import assert from "node:assert/strict";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

test("Database Schema: migrations/0003_library_persistence.sql creates real relational tables and relations", async () => {
  const db = new PGlite();
  await db.waitReady;

  // 1. Apply auth migration for user table
  const authSql = readFileSync(join(rootDir, "migrations", "0001_auth.sql"), "utf8");
  await db.exec(authSql);

  // 2. Apply library persistence migration
  const libSql = readFileSync(join(rootDir, "migrations", "0003_library_persistence.sql"), "utf8");
  await db.exec(libSql);

  // 3. Create test user
  const userId = "usr_test_123";
  await db.query(
    `insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
     values ($1, 'Test User', 'test@sonara.app', true, now(), now())`,
    [userId]
  );

  // 4. Create playlist in user_playlist
  const playlistId = "pl_synthwave_01";
  await db.query(
    `insert into "user_playlist" (id, user_id, name, description)
     values ($1, $2, 'Midnight Neon', 'Synthwave and cyber vibes')`,
    [playlistId, userId]
  );

  const plRes = await db.query(`select * from "user_playlist" where id = $1`, [playlistId]);
  assert.equal(plRes.rows.length, 1);
  assert.equal(plRes.rows[0].name, "Midnight Neon");
  assert.equal(plRes.rows[0].user_id, userId);

  // 5. Add tracks to playlist_track
  await db.query(
    `insert into "playlist_track" (
      id, playlist_id, track_id, title, artist, stream_url, position
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    ["plt_1", playlistId, "trk_101", "Resonance", "HOME", "https://cdn.example.com/101.mp3", 0]
  );

  await db.query(
    `insert into "playlist_track" (
      id, playlist_id, track_id, title, artist, stream_url, position
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    ["plt_2", playlistId, "trk_102", "Sunset", "The Midnight", "https://cdn.example.com/102.mp3", 1]
  );

  const tracksRes = await db.query(
    `select track_id, title, position from "playlist_track" where playlist_id = $1 order by position asc`,
    [playlistId]
  );
  assert.equal(tracksRes.rows.length, 2);
  assert.equal(tracksRes.rows[0].track_id, "trk_101");
  assert.equal(tracksRes.rows[1].track_id, "trk_102");

  // 6. User favorite: toggle like
  await db.query(
    `insert into "user_favorite" (
      id, user_id, track_id, title, artist, stream_url
    ) values ($1, $2, $3, $4, $5, $6)`,
    ["fav_1", userId, "trk_101", "Resonance", "HOME", "https://cdn.example.com/101.mp3"]
  );

  const favRes = await db.query(`select * from "user_favorite" where user_id = $1`, [userId]);
  assert.equal(favRes.rows.length, 1);
  assert.equal(favRes.rows[0].track_id, "trk_101");

  // Duplicate like should trigger unique constraint
  await assert.rejects(
    async () => {
      await db.query(
        `insert into "user_favorite" (
          id, user_id, track_id, title, artist, stream_url
        ) values ($1, $2, $3, $4, $5, $6)`,
        ["fav_2", userId, "trk_101", "Resonance", "HOME", "https://cdn.example.com/101.mp3"]
      );
    },
    /duplicate key|unique constraint/i
  );

  // 7. Play history logging and trending aggregation
  await db.query(
    `insert into "user_play_history" (
      id, user_id, session_id, track_id, title, artist, stream_url
    ) values 
    ('h1', $1, 'sess_1', 'trk_101', 'Resonance', 'HOME', 'https://cdn.example.com/101.mp3'),
    ('h2', $1, 'sess_2', 'trk_101', 'Resonance', 'HOME', 'https://cdn.example.com/101.mp3'),
    ('h3', null, 'sess_3', 'trk_102', 'Sunset', 'The Midnight', 'https://cdn.example.com/102.mp3')`,
    [userId]
  );

  const historyRes = await db.query(`select count(*) as cnt from "user_play_history"`);
  assert.equal(Number(historyRes.rows[0].cnt), 3);

  // Check trending aggregation
  const trendingRes = await db.query(
    `select track_id, count(*)::int as play_count
     from "user_play_history"
     group by track_id
     order by play_count desc`
  );
  assert.equal(trendingRes.rows[0].track_id, "trk_101");
  assert.equal(Number(trendingRes.rows[0].play_count), 2);

  // 8. Test Cascade Delete
  await db.query(`delete from "user_playlist" where id = $1`, [playlistId]);
  const cascadeRes = await db.query(`select count(*) as cnt from "playlist_track" where playlist_id = $1`, [playlistId]);
  assert.equal(Number(cascadeRes.rows[0].cnt), 0);
});

test("Audio Streaming Proxy (/api/stream): Range headers produce HTTP 206 Partial Content", async () => {
  // Mock upstream audio server
  const sampleAudioBuffer = Buffer.alloc(10000, 0x41); // 10,000 bytes

  // Create a minimal fetch mock or local server to test range response handling
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const range = options.headers?.Range;
    if (url.includes("upstream-with-206.mp3") && range) {
      // Simulate upstream server returning 206
      return new Response(sampleAudioBuffer.subarray(0, 500), {
        status: 206,
        headers: {
          "Content-Range": "bytes 0-499/10000",
          "Content-Length": "500",
          "Content-Type": "audio/mp4",
          "Accept-Ranges": "bytes",
        },
      });
    }

    if (url.includes("upstream-ignoring-range.mp3")) {
      // Simulate Saavn/CDN behavior: returns full 200 OK despite client Range header
      return new Response(sampleAudioBuffer, {
        status: 200,
        headers: {
          "Content-Length": "10000",
          "Content-Type": "audio/mp4",
          "Accept-Ranges": "bytes",
        },
      });
    }

    return originalFetch(url, options);
  };

  try {
    // Import stream route
    const { Route } = await import("../src/routes/api/stream.ts");
    const getHandler = Route.options.server.handlers.GET;

    // Test 1: Upstream that ignored Range header -> Proxy slices buffer and returns 206
    const req1 = new Request("http://localhost/api/stream?url=https://cdn.example.com/upstream-ignoring-range.mp3", {
      headers: { Range: "bytes=100-299" },
    });
    const res1 = await getHandler({ request: req1 });
    assert.equal(res1.status, 206, "Should return HTTP 206 Partial Content");
    assert.equal(res1.headers.get("Accept-Ranges"), "bytes");
    assert.equal(res1.headers.get("Content-Range"), "bytes 100-299/10000");
    assert.equal(res1.headers.get("Content-Length"), "200");
    const body1 = await res1.arrayBuffer();
    assert.equal(body1.byteLength, 200);

    // Test 2: Upstream that already answered with 206
    const req2 = new Request("http://localhost/api/stream?url=https://cdn.example.com/upstream-with-206.mp3", {
      headers: { Range: "bytes=0-499" },
    });
    const res2 = await getHandler({ request: req2 });
    assert.equal(res2.status, 206);
    assert.equal(res2.headers.get("Content-Range"), "bytes 0-499/10000");

    // Test 3: Missing url parameter -> 400
    const req3 = new Request("http://localhost/api/stream");
    const res3 = await getHandler({ request: req3 });
    assert.equal(res3.status, 400);

    // Test 4: Range out of bounds -> 416
    const req4 = new Request("http://localhost/api/stream?url=https://cdn.example.com/upstream-ignoring-range.mp3", {
      headers: { Range: "bytes=15000-20000" },
    });
    const res4 = await getHandler({ request: req4 });
    assert.equal(res4.status, 416);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
