import { test } from "node:test";
import assert from "node:assert/strict";
import { nextRecoveryStep, proxiedUrl } from "./playback-recovery.ts";

const saavn = "https://aac.saavncdn.com/111/abc_320.mp4";
const other = "https://cdn.example.com/song.mp3";

function walk(streamUrl: string, isRadio = false) {
  const tried = new Set<string>();
  let currentSrc = streamUrl;
  const steps: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const step = nextRecoveryStep({ streamUrl, currentSrc, tried, isRadio });
    if (step.kind === "skip") {
      steps.push("skip");
      return steps;
    }
    tried.add(step.key);
    steps.push(step.key);
    if (step.kind === "src") currentSrc = step.src;
  }
  throw new Error("recovery did not terminate");
}

test("tries every fallback once, in order, then skips", () => {
  assert.deepEqual(walk(saavn), ["lower-bitrate", "proxy", "resolve", "skip"]);
  assert.deepEqual(walk(other), ["proxy", "resolve", "skip"]);
});

test("live radio never asks for a resolve", () => {
  assert.deepEqual(walk("http://radio.example.com/live", true), ["proxy", "skip"]);
});

test("lower bitrate keeps the container", () => {
  const step = nextRecoveryStep({ streamUrl: saavn, currentSrc: saavn, tried: new Set(), isRadio: false });
  assert.equal(step.kind === "src" && step.src, "https://aac.saavncdn.com/111/abc_160.mp4");
});

test("an already proxied or offline source is not proxied again", () => {
  const viaProxy = nextRecoveryStep({ streamUrl: other, currentSrc: proxiedUrl(other), tried: new Set(), isRadio: false });
  assert.equal(viaProxy.kind, "resolve");
  const offline = nextRecoveryStep({ streamUrl: other, currentSrc: "blob:abc", tried: new Set(), isRadio: false });
  assert.equal(offline.kind, "resolve");
});
