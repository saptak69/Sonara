import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRequestOrigin, clientKey, createRateLimiter } from "./stream-guard.ts";

const url = "https://sonara.example/api/stream?url=x";

test("allows same-origin and header-less requests", () => {
  assert.equal(checkRequestOrigin(url, new Headers({ "sec-fetch-site": "same-origin" })).ok, true);
  assert.equal(checkRequestOrigin(url, new Headers({ origin: "https://sonara.example" })).ok, true);
  assert.equal(checkRequestOrigin(url, new Headers()).ok, true);
});

test("blocks other websites", () => {
  assert.equal(checkRequestOrigin(url, new Headers({ "sec-fetch-site": "cross-site" })).ok, false);
  assert.equal(checkRequestOrigin(url, new Headers({ origin: "https://evil.example" })).ok, false);
});

test("rate limiter caps each key per window and resets", () => {
  const hit = createRateLimiter({ limit: 2, windowMs: 1000 });
  assert.equal(hit("a", 0), true);
  assert.equal(hit("a", 10), true);
  assert.equal(hit("a", 20), false);
  assert.equal(hit("b", 20), true);
  assert.equal(hit("a", 1000), true);
});

test("client key uses the first forwarded address", () => {
  assert.equal(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
});
