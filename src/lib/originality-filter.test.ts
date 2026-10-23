import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCoverOrDerivative } from "./music-filter.ts";

describe("isCoverOrDerivative - Sonara Studio Originality Guard", () => {
  describe("1. Legitimate songs with 'cover' in title/artist (Zero False Positives)", () => {
    it("preserves legitimate studio recordings containing 'cover' in their name", () => {
      assert.equal(isCoverOrDerivative("Cover Me In Sunshine", "P!nk, Willow Sage Hart"), false);
      assert.equal(isCoverOrDerivative("Under Cover of Darkness", "The Strokes"), false);
      assert.equal(isCoverOrDerivative("Cover Me", "Bruce Springsteen"), false);
      assert.equal(isCoverOrDerivative("Cover Me", "Depeche Mode"), false);
      assert.equal(isCoverOrDerivative("Cover Girl", "Big Time Rush"), false);
      assert.equal(isCoverOrDerivative("Cover Girl", "RuPaul"), false);
      assert.equal(isCoverOrDerivative("Deep Cover", "Dr. Dre & Snoop Dogg"), false);
      assert.equal(isCoverOrDerivative("Don't Judge a Book by Its Cover", "Bo Diddley"), false);
      assert.equal(isCoverOrDerivative("Covered in Roses", "Felly"), false);
      assert.equal(isCoverOrDerivative("Cover Up", "Imagine Dragons"), false);
    });

    it("preserves legitimate bands that have 'Cover' in their official name", () => {
      assert.equal(isCoverOrDerivative("Twilight", "Cover Drive"), false);
      assert.equal(isCoverOrDerivative("Show Me", "The Cover Girls"), false);
    });

    it("preserves legitimate electronic tracks containing 'Reverb'", () => {
      assert.equal(isCoverOrDerivative("Reverb (Original Mix)", "Soundprank"), false);
      assert.equal(isCoverOrDerivative("Slow Down", "Selena Gomez"), false);
    });
  });

  describe("2. Rejection of amateur covers and derivative works", () => {
    it("rejects acoustic, piano, and parenthesized covers", () => {
      assert.equal(isCoverOrDerivative("Blinding Lights (Cover)", "Random Singer"), true);
      assert.equal(isCoverOrDerivative("Yellow (Acoustic Cover)", "Boyce Avenue"), true);
      assert.equal(isCoverOrDerivative("Flowers [Piano Cover]", "The Piano Guy"), true);
      assert.equal(isCoverOrDerivative("Someone Like You (Cover Version)", "Pop Cover"), true);
      assert.equal(isCoverOrDerivative("Shape of You - Cover by Boyce Avenue", "Boyce Avenue"), true);
      assert.equal(isCoverOrDerivative("My Cover of Creep", "Bedroom Artist"), true);
      assert.equal(isCoverOrDerivative("Cover of Hotel California", "Guitar Guy"), true);
    });

    it("rejects tribute bands and soundalike recordings", () => {
      assert.equal(isCoverOrDerivative("Tribute to Coldplay - Yellow", "The Tribute Band"), true);
      assert.equal(isCoverOrDerivative("In the style of Adele - Easy On Me", "Soundalike Pro"), true);
      assert.equal(isCoverOrDerivative("Bohemian Rhapsody", "The Queen Tribute Band"), true);
      assert.equal(isCoverOrDerivative("As Made Famous by Bruno Mars - Uptown Funk", "Backing Stars"), true);
    });

    it("rejects slowed, reverb, nightcore, and 8D edits", () => {
      assert.equal(isCoverOrDerivative("Starboy (Slowed + Reverb)", "The Weeknd"), true);
      assert.equal(isCoverOrDerivative("Starboy - Slowed Down", "VibeEdits"), true);
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
      assert.equal(isCoverOrDerivative("Synthetic Voice Duet", "AI Bot"), true);
    });
  });

  describe("3. Official standard releases", () => {
    it("permits authentic, original studio master recordings", () => {
      assert.equal(isCoverOrDerivative("Espresso", "Sabrina Carpenter"), false);
      assert.equal(isCoverOrDerivative("BIRDS OF A FEATHER", "Billie Eilish"), false);
      assert.equal(isCoverOrDerivative("Cruel Summer", "Taylor Swift"), false);
      assert.equal(isCoverOrDerivative("Kesariya", "Arijit Singh"), false);
      assert.equal(isCoverOrDerivative("Tum Hi Ho", "Arijit Singh"), false);
    });
  });

  describe("4. Intentional user queries", () => {
    it("allows covers or remixes only if intentionally requested by the user", () => {
      assert.equal(
        isCoverOrDerivative("Blinding Lights (Acoustic Cover)", "Random Singer", "blinding lights cover"),
        false,
      );
      assert.equal(
        isCoverOrDerivative("Starboy (Slowed + Reverb)", "The Weeknd", "starboy slowed reverb"),
        false,
      );
      assert.equal(
        isCoverOrDerivative("Nightcore - Titanium", "Nightcore Lab", "titanium nightcore"),
        false,
      );
    });
  });
});
