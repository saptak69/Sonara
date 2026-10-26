/**
 * Builds the tiny local web folder that ships inside the Android app.
 *
 * Sonara loads the live site (see capacitor.config.ts), so this folder only holds
 * the offline player page, shown when the site can't be reached on first launch.
 * Run via `npm run android:sync`.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist");
mkdirSync(out, { recursive: true });
for (const name of ["index.html", "error.html"]) {
  copyFileSync(join(root, "public", "error.html"), join(out, name));
}
console.log("[android] wrote dist/index.html and dist/error.html");
