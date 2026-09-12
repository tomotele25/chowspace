import axios from "axios";
import { BACKENDURL } from "@/lib/api";

/**
 * Influencer link attribution, client-side.
 *
 * Same convention as the birthday flag in pages/checkout/[slug].js — a
 * single keyed value in localStorage, read/written directly by the pages
 * that need it. No cookies, nothing sent to the server except the two
 * fire-and-forget beacons below.
 */
const REF_KEY = "chowspace_ref";
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Called from pages/i/[code].js when someone lands on an influencer link. */
export function storeReferralCode(code) {
  if (typeof window === "undefined" || !code) return;
  try {
    localStorage.setItem(REF_KEY, JSON.stringify({ code, ts: Date.now() }));
  } catch {
    // Private browsing / storage disabled — attribution just doesn't happen.
  }
}

/**
 * The still-valid stored code, or null. Checkout calls this when building the
 * order payload; anything older than 30 days is treated as if nothing were
 * stored.
 */
export function getStoredReferralCode() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const { code, ts } = JSON.parse(raw);
    if (!code || Date.now() - ts > REF_TTL_MS) return null;
    return code;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget tracking beacons. Never awaited by a caller that cares
 * about the result, never allowed to throw — a failed beacon must not affect
 * the page that fired it.
 */
export function trackReferralClick(code, path) {
  if (!code) return;
  axios
    .post(`${BACKENDURL}/api/ref/click`, { code, path })
    .catch(() => {});
}

export function trackReferralInstall(code) {
  if (!code) return;
  axios.post(`${BACKENDURL}/api/ref/install`, { code }).catch(() => {});
}
