import fs from "node:fs";

let content = fs.readFileSync("src/styles.css", "utf8");

const newTheme = `@theme {
  --color-abyss: #0B0A0A;
  --color-ink: #0B0A0A;
  --color-ink-2: #151211;
  --color-paper: #F4EFEA;

  --color-bg: #0B0A0A;
  --color-bg-sunken: #090808;
  --color-surface: #151211;
  --color-surface-2: #1E1A18;
  --color-surface-3: #28231F;
  --color-elevated: #151211;
  --color-chip: #1E1A18;
  --color-hover: #1E1A18;
  --color-fg: #F4EFEA;
  --color-text-primary: #F4EFEA;
  --color-text-secondary: #A9A19B;
  --color-muted: #A9A19B;
  --color-subtle: #7A726C;
  --color-text-muted: #7A726C;
  --color-accent: #FF5B2E;
  --color-accent-hover: #FF6E45;
  --color-accent-pressed: #E64E24;
  --color-accent-soft: rgba(255, 91, 46, 0.12);
  --color-accent-ink: #0B0A0A;
  --color-accent-fg: #0B0A0A;
  --color-ok: #52B58A;
  --color-status-ok: #52B58A;
  --color-border: rgba(255, 238, 225, 0.07);
  --color-hairline: rgba(255, 238, 225, 0.07);
  --color-glow: rgba(255, 91, 46, 0.15);

  --font-display: "Outfit", "Noto Sans Bengali", "Noto Sans Devanagari", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  --font-sans: "Outfit", "Noto Sans Bengali", "Noto Sans Devanagari", system-ui, sans-serif;

  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 24px;
  --radius-pill: 9999px;

  --spacing-player: 4.75rem;
  --spacing-nav: 4rem;
  --spacing-sidebar: 14rem;
  --spacing-right-sidebar: 20rem;

  --shadow-floating: 0 12px 32px rgba(0, 0, 0, 0.5);
  --shadow-pop: 0 12px 32px rgba(0, 0, 0, 0.5);
}`;

const oldThemeStart = content.indexOf("@theme {");
const oldThemeEnd = content.indexOf("}", oldThemeStart) + 1;
content = content.slice(0, oldThemeStart) + newTheme + content.slice(oldThemeEnd);
fs.writeFileSync("src/styles.css", content, "utf8");
console.log("Successfully updated @theme in src/styles.css");
