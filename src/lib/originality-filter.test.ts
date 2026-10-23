import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCoverOrDerivative } from "./music-filter.ts";

describe("isCoverOrDerivative - Sonara Studio Originality Guard", () => {
  it("rejects acoustic, amateur, and tribute covers when searching for standard songs", () => {
    assert.equal(isCoverOrDerivative("Blinding Lights (Acoustic Cover)", "Random Singer"), true);
    assert.equal(isCoverOrDerivative("Flowers (Cover)", "Indie Artist"), true);
    assert.equal(isCoverOrDerivative("Tribute to Coldplay - Yellow", "The Tribute Band"), true);
    assert.equal(isCoverOrDerivative("Shape of You", "Boyce Avenue Cover"), true);
  });

  it("rejects slowed, reverb, nightcore, and 8D edits", () => {
    assert.equal(isCoverOrDerivative("Starboy (Slowed + Reverb)", "The Weeknd"), true);
    assert.equal(isCoverOrDerivative("Nightcore - Titanium", "Nightcore Lab"), true);
    assert.equal(isCoverOrDerivative("Sped up - Golden Hour", "JVKE"), true);
    assert.equal(isCoverOrDerivative("8D Audio - Daylight", "David Kushner"), true);
  });

  it("rejects karaoke and backing tracks", () => {
    assert.equal(isCoverOrDerivative("Anti-Hero (Karaoke Version)", "SingAlong Tracks"), true);
    assert.equal(isCoverOrDerivative("Rolling in the Deep (Instrumental)", "Backing Tracks"), true);
    assert.equal(isCoverOrDerivative("Vampire (Backing Track)", "Pro Karaoke"), true);
  });

  it("rejects AI-generated voices, fake models, and type beats", () => {
    assert.equal(isCoverOrDerivative("Heart on My Sleeve (AI Cover)", "Drake AI"), true);
    assert.equal(isCoverOrDerivative("Juice WRLD Type Beat 2024", "Beatmaker123"), true);
    assert.equal(isCoverOrDerivative("Billie Eilish (AI Version)", "RoboTunes"), true);
    assert.equal(isCoverOrDerivative("Made famous by Adele - Easy On Me", "Studio Musicians"), true);
  });

  it("permits authentic, original studio master recordings", () => {
    assert.equal(isCoverOrDerivative("Espresso", "Sabrina Carpenter"), false);
    assert.equal(isCoverOrDerivative("BIRDS OF A FEATHER", "Billie Eilish"), false);
    assert.equal(isCoverOrDerivative("Cruel Summer", "Taylor Swift"), false);
    assert.equal(isCoverOrDerivative("Kesariya", "Arijit Singh"), false);
  });

  it("allows covers or remixes only if intentionally requested by the user", () => {
    assert.equal(
      isCoverOrDerivative("Blinding Lights (Acoustic Cover)", "Random Singer", "blinding lights cover"),
      false,
    );
    assert.equal(
      isCoverOrDerivative("Starboy (Slowed + Reverb)", "The Weeknd", "starboy slowed reverb"),
      false,
    );
  });
});
