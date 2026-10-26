/**
 * Remote-control support for Android TV (and keyboard users anywhere).
 *
 * - Arrow keys move focus to the nearest control in that direction
 *   ("spatial navigation"), so a D-pad can reach every button and card.
 * - Media keys (play/pause, next, previous, fast-forward, rewind) drive the player.
 * - The Back key closes whatever is on top before going back a page.
 * - <html> gets the `tv` class while a remote/keyboard is in use, which turns
 *   on large focus rings (see styles.css). Touch or mouse input turns it off
 *   again, except on actual TVs where it stays on.
 */
import { usePlayer } from "./player-store";

type Direction = "up" | "down" | "left" | "right";

const ARROWS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[role=button]:not([aria-disabled=true])",
  "[role=slider]",
  "[role=tab]",
  "[role=menuitem]",
  "[role=option]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function isTvDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android TV|GoogleTV|Google TV|\bAFT[A-Z]|BRAVIA|SmartTV|SMART-TV|Tizen|Web0S|CrKey|\bTV\b/i.test(ua)) {
    return true;
  }
  // TV browsers report no fine pointer and no hover at all.
  return window.matchMedia("(pointer: none) and (hover: none)").matches;
}

function isVisible(el: HTMLElement): boolean {
  if (el.closest("[inert], [aria-hidden=true], [data-open=false]")) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  const style = getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
}

/** The topmost open dialog/drawer, so focus can't wander behind it. */
function activeScope(): ParentNode {
  const layers = Array.from(
    document.querySelectorAll<HTMLElement>("[role=dialog], [role=menu], [data-tv-scope=true]"),
  ).filter(isVisible);
  return layers.at(-1) ?? document;
}

function candidates(scope: ParentNode, current: Element | null): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el !== current && !el.hasAttribute("data-tv-skip") && isVisible(el),
  );
}

/**
 * Pick the element whose box is closest in the requested direction. Elements
 * that overlap the current one on the cross axis (same row / same column) win
 * over diagonal ones, which is what people expect from a TV grid.
 */
function nearest(from: DOMRect, direction: Direction, pool: HTMLElement[]): HTMLElement | null {
  const fromX = from.left + from.width / 2;
  const fromY = from.top + from.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of pool) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;

    let gap: number;
    let cross: number;
    let sameLane: boolean;

    if (direction === "left" || direction === "right") {
      if (direction === "right" ? x <= fromX + 1 : x >= fromX - 1) continue;
      gap = direction === "right" ? r.left - from.right : from.left - r.right;
      cross = Math.abs(y - fromY);
      sameLane = r.top < from.bottom && r.bottom > from.top;
    } else {
      if (direction === "down" ? y <= fromY + 1 : y >= fromY - 1) continue;
      gap = direction === "down" ? r.top - from.bottom : from.top - r.bottom;
      cross = Math.abs(x - fromX);
      sameLane = r.left < from.right && r.right > from.left;
    }

    const score = Math.max(gap, 0) + (sameLane ? cross * 0.1 : 1000 + cross * 2);
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

function focusElement(el: HTMLElement) {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
}

function focusFirst(scope: ParentNode) {
  const preferred =
    scope.querySelector<HTMLElement>("[data-tv-autofocus]") ??
    (scope === document ? document.querySelector<HTMLElement>("#main-scroll-area") : null);
  const pool = candidates(preferred ?? scope, null);
  const first = pool.find((el) => el.matches("[data-tv-autofocus]")) ?? pool[0];
  if (first) focusElement(first);
}

/** Should the arrow key stay with the focused control instead of moving focus? */
function controlKeepsArrow(el: Element | null, direction: Direction): boolean {
  if (!el) return false;
  const horizontal = direction === "left" || direction === "right";
  if (el instanceof HTMLTextAreaElement) return true;
  // An open autocomplete list uses the arrows to move through suggestions.
  if (el.getAttribute("aria-expanded") === "true") return true;
  if (el instanceof HTMLInputElement) {
    if (el.type === "range") return horizontal;
    // Let the caret move inside text fields; up/down still navigate.
    return horizontal && el.value.length > 0;
  }
  if (el.getAttribute("role") === "slider") return horizontal;
  // Radix menus and tabs handle their own arrow keys.
  if (el.closest("[role=menu], [role=listbox], [role=radiogroup]")) return true;
  return false;
}

function setRemoteMode(on: boolean) {
  document.documentElement.classList.toggle("tv", on);
}

const SEEK_STEP = 10;

function handleMediaKey(key: string): boolean {
  const player = usePlayer.getState();
  switch (key) {
    case "MediaPlayPause":
      player.toggle();
      return true;
    case "MediaPlay":
      player.setPlaying(true);
      return true;
    case "MediaPause":
    case "MediaStop":
      player.setPlaying(false);
      return true;
    case "MediaTrackNext":
      player.next();
      return true;
    case "MediaTrackPrevious":
      player.prev();
      return true;
    case "MediaFastForward":
      player.seekTo(Math.min(player.duration || Infinity, player.currentTime + SEEK_STEP));
      return true;
    case "MediaRewind":
      player.seekTo(Math.max(0, player.currentTime - SEEK_STEP));
      return true;
    default:
      return false;
  }
}

/** Close the top layer (dialog, drawer, full player). Returns true if something closed. */
export function closeTopLayer(): boolean {
  const scope = activeScope();
  // Radix dialogs and menus close on Escape (the event bubbles to their document listener).
  if (scope instanceof HTMLElement && !scope.matches("[data-tv-scope=true]")) {
    scope.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    return true;
  }

  const player = usePlayer.getState();
  if (player.equalizerOpen) {
    player.setEqualizerOpen(false);
    return true;
  }
  if (player.lyricsOpen) {
    player.setLyricsOpen(false);
    return true;
  }
  if (player.expanded) {
    player.setExpanded(false);
    return true;
  }
  if (player.queueOpen) {
    player.setQueueOpen(false);
    return true;
  }
  return false;
}

let installed = false;

export function installRemoteNavigation(): () => void {
  if (installed || typeof window === "undefined") return () => {};
  installed = true;

  const onTv = isTvDevice();
  if (onTv) setRemoteMode(true);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

    if (handleMediaKey(event.key)) {
      event.preventDefault();
      return;
    }

    // Browser-level Back on TV remotes (the Android app gets a backButton event instead).
    if (event.key === "GoBack" || event.key === "BrowserBack") {
      event.preventDefault();
      if (!closeTopLayer()) history.back();
      return;
    }

    const direction = ARROWS[event.key];
    if (!direction) return;

    setRemoteMode(true);
    const active = document.activeElement as HTMLElement | null;
    if (controlKeepsArrow(active, direction)) return;

    const scope = activeScope();
    const hasFocus = active && active !== document.body && (scope === document || scope.contains(active));
    event.preventDefault();

    if (!hasFocus) {
      focusFirst(scope);
      return;
    }

    const target = nearest(active.getBoundingClientRect(), direction, candidates(scope, active));
    if (target) focusElement(target);
  };

  const onPointer = (event: PointerEvent) => {
    // A real mouse or finger means the remote isn't in use (unless this is a TV).
    if (!onTv && event.pointerType !== "") setRemoteMode(false);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("pointerdown", onPointer, { passive: true });

  return () => {
    installed = false;
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("pointerdown", onPointer);
  };
}
