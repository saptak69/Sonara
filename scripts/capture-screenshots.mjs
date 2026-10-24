import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/admin/.gemini/antigravity/brain/a8820536-6b3a-4ddf-8283-7bae74781a12/screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://localhost:8080';

async function run() {
  console.log('Launching browser with Playwright & Chrome...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  // 1. Desktop captures (1280x800)
  console.log('Creating Desktop context (1280x800)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();

  // Desktop Home
  console.log('Capturing Desktop Home...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '01-desktop-home.png') });

  // Desktop Explore
  console.log('Capturing Desktop Explore...');
  await page.goto(`${BASE_URL}/explore`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '02-desktop-explore.png') });

  // Desktop Radio
  console.log('Capturing Desktop Radio...');
  await page.goto(`${BASE_URL}/radio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '03-desktop-radio.png') });

  // Desktop Library - Playlists tab
  console.log('Capturing Desktop Library Playlists...');
  await page.goto(`${BASE_URL}/library?tab=playlists`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '04-desktop-library-playlists.png') });

  // Desktop Library - Downloads tab
  console.log('Capturing Desktop Library Downloads...');
  await page.goto(`${BASE_URL}/library?tab=downloads`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '05-desktop-library-downloads.png') });

  // Desktop Search
  console.log('Capturing Desktop Search...');
  await page.goto(`${BASE_URL}/search?q=Starboy`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '06-desktop-search-results.png') });

  // Track 3-dots Menu test & screenshot
  console.log('Capturing 3-dots Track Menu...');
  const threeDots = page.locator('button[title="More options"]').first();
  if (await threeDots.isVisible()) {
    await threeDots.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, '07-desktop-track-menu-open.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // Play a track to populate player bar & full player
  console.log('Starting playback to capture player states...');
  await page.evaluate(() => {
    // @ts-ignore
    window.usePlayer?.getState().playTrack({
      id: "starboy-wknd",
      title: "Starboy (feat. Daft Punk)",
      artist: "The Weeknd",
      album: "Starboy",
      duration: 230,
      artwork: "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
      source: "youtube",
      streamUrl: "https://example.com/audio.mp3"
    }, []);
  });
  await page.waitForTimeout(600);

  // Equalizer Modal
  console.log('Capturing Equalizer Modal...');
  await page.evaluate(() => {
    // @ts-ignore
    window.usePlayer?.getState().setEqualizerOpen(true);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, '08-desktop-equalizer-modal.png') });
  await page.evaluate(() => {
    // @ts-ignore
    window.usePlayer?.getState().setEqualizerOpen(false);
  });
  await page.waitForTimeout(400);

  // 1-Tap Spotify / Apple Music Importer Modal
  console.log('Capturing Importer Modal...');
  await page.goto(`${BASE_URL}/library?tab=playlists`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const importBtn = page.locator('button:has-text("Import")').first();
  if (await importBtn.isVisible()) {
    await importBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, '09-desktop-importer-modal.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // Desktop Full Player
  console.log('Capturing Desktop Full Screen Player...');
  await page.evaluate(() => {
    // @ts-ignore
    window.usePlayer?.getState().playTrack({
      id: "starboy-wknd",
      title: "Starboy (feat. Daft Punk)",
      artist: "The Weeknd",
      album: "Starboy",
      duration: 230,
      artwork: "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
      source: "youtube",
      streamUrl: "https://example.com/audio.mp3"
    }, []);
    // @ts-ignore
    window.usePlayer?.getState().setExpanded(true);
    // @ts-ignore
    window.usePlayer?.getState().setQueueOpen(false);
    // @ts-ignore
    window.usePlayer?.getState().setLyricsOpen(false);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '10-desktop-full-player.png') });
  await page.evaluate(() => {
    // @ts-ignore
    window.usePlayer?.getState().setExpanded(false);
  });

  await desktopContext.close();

  // 2. Mobile Portrait Captures (390x844 - iPhone 14/15)
  console.log('Capturing Mobile Portrait screens (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  // Mobile Home with dock
  await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '11-mobile-home-portrait.png') });

  // Mobile Library
  await mobilePage.goto(`${BASE_URL}/library?tab=downloads`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '12-mobile-library-downloads.png') });

  // Mobile Search with Track Rows (showing dedicated download button and 3-dots)
  await mobilePage.goto(`${BASE_URL}/search?q=Blinding+Lights`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '13-mobile-search-trackrows.png') });

  // Tap 3-dots on mobile
  const mobThreeDots = mobilePage.locator('button[title="More options"]').first();
  if (await mobThreeDots.isVisible()) {
    await mobThreeDots.click();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: path.join(OUT_DIR, '14-mobile-track-menu.png') });
    await mobilePage.keyboard.press('Escape');
    await mobilePage.waitForTimeout(300);
  }

  // Play track and expand mobile player
  await mobilePage.evaluate(() => {
    // @ts-ignore
    window.usePlayer?.getState().playTrack({
      id: "starboy-wknd",
      title: "Starboy (feat. Daft Punk)",
      artist: "The Weeknd",
      album: "Starboy",
      duration: 230,
      artwork: "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
      source: "youtube",
      streamUrl: "https://example.com/audio.mp3"
    }, []);
    // @ts-ignore
    window.usePlayer?.getState().setExpanded(true);
    // @ts-ignore
    window.usePlayer?.getState().setQueueOpen(false);
    // @ts-ignore
    window.usePlayer?.getState().setLyricsOpen(false);
  });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '15-mobile-full-player-portrait.png') });

  await mobileContext.close();

  // 3. Mobile Landscape Captures (844x390 - Horizontal Phone)
  console.log('Capturing Mobile Landscape (Horizontal) screens (844x390)...');
  const landscapeContext = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const landscapePage = await landscapeContext.newPage();

  // Mobile Landscape Home
  await landscapePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await landscapePage.waitForTimeout(1000);
  await landscapePage.screenshot({ path: path.join(OUT_DIR, '16-mobile-home-landscape.png') });

  // Mobile Landscape Library
  await landscapePage.goto(`${BASE_URL}/library?tab=playlists`, { waitUntil: 'networkidle' });
  await landscapePage.waitForTimeout(800);
  await landscapePage.screenshot({ path: path.join(OUT_DIR, '17-mobile-library-landscape.png') });

  // Mobile Landscape Full Player Cockpit
  console.log('Capturing Mobile Landscape Full Screen Player...');
  await landscapePage.evaluate(() => {
    // @ts-ignore
    window.usePlayer?.getState().playTrack({
      id: "starboy-wknd",
      title: "Starboy (feat. Daft Punk)",
      artist: "The Weeknd",
      album: "Starboy",
      duration: 230,
      artwork: "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
      source: "youtube",
      streamUrl: "https://example.com/audio.mp3"
    }, []);
    // @ts-ignore
    window.usePlayer?.getState().setExpanded(true);
    // @ts-ignore
    window.usePlayer?.getState().setQueueOpen(false);
    // @ts-ignore
    window.usePlayer?.getState().setLyricsOpen(false);
  });
  await landscapePage.waitForTimeout(1000);
  await landscapePage.screenshot({ path: path.join(OUT_DIR, '18-mobile-full-player-landscape.png') });

  await landscapeContext.close();
  await browser.close();

  // Also mirror screenshots to workspace directory
  const LOCAL_DIR = 'F:/random/music player/screenshots';
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.endsWith('.png')) {
      fs.copyFileSync(path.join(OUT_DIR, file), path.join(LOCAL_DIR, file));
    }
  }

  console.log('ALL_SCREENSHOTS_COMPLETED');
}

run().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
