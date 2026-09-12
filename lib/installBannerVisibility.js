/**
 * Shared "should we even show an install/App Store nudge right now" rules,
 * used by both components/AndroidInstallBanner.jsx (the fixed bottom pill)
 * and components/GetAppBanner.jsx (the inline homepage/confirmation
 * banner) — one budget between them, so someone who saw or dismissed it on
 * one page doesn't get asked again immediately on the other.
 *
 * Two independent reasons to stop showing it:
 *   - dismissed  → back off for DISMISS_COOLDOWN_MS, then eligible again
 *   - seen SEEN_CAP times total → stop for good; a banner nobody has
 *     explicitly closed but keeps seeing every visit reads as a permanent
 *     fixture, not a prompt
 */
const DISMISSED_KEY = "chowspace_pwa_banner_dismissed_at";
const SEEN_COUNT_KEY = "chowspace_pwa_banner_seen_count";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SEEN_CAP = 5;

function readNumber(key) {
  try {
    return Number(localStorage.getItem(key) || 0);
  } catch {
    return 0;
  }
}

/** Call before deciding to render. True means it's fine to show. */
export function canShowInstallBanner() {
  const dismissedAt = readNumber(DISMISSED_KEY);
  const withinCooldown =
    dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  if (withinCooldown) return false;

  return readNumber(SEEN_COUNT_KEY) < SEEN_CAP;
}

/** Call once, right after deciding to actually render it. */
export function recordBannerSeen() {
  try {
    localStorage.setItem(SEEN_COUNT_KEY, String(readNumber(SEEN_COUNT_KEY) + 1));
  } catch {
    /* best effort */
  }
}

/** Call when the user taps the dismiss/close control. */
export function dismissInstallBanner() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    /* best effort */
  }
}
