import { useEffect, useRef, useState } from "react";

const INSTALLED_KEY = "chowspace_pwa_installed";

/**
 * Shared "can we offer an install/App Store CTA" state, extracted out of
 * components/AndroidInstallBanner.jsx so both it and components/GetAppBanner.jsx
 * read the same platform detection and the same beforeinstallprompt handling
 * instead of each keeping their own copy.
 *
 * Returns:
 *   platform       "ios" | "android" | "other"
 *   canInstall     true once the browser has offered its native install
 *                  prompt and it hasn't been used/installed/marked yet
 *   promptInstall  call from a click handler (browsers require a user
 *                  gesture); resolves true if the user accepted
 */
export function useInstallPrompt() {
  const [platform, setPlatform] = useState("other");
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      setPlatform("ios");
    } else if (/Android/.test(ua)) {
      setPlatform("android");
    }

    const alreadyStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    let installed = false;
    try {
      installed = localStorage.getItem(INSTALLED_KEY) === "1";
    } catch {
      /* storage unavailable — treat as not installed */
    }
    if (alreadyStandalone || installed) return;

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };
    const markInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        /* best effort */
      }
      setCanInstall(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = deferredPrompt.current;
    if (!promptEvent) return false;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    deferredPrompt.current = null;
    if (outcome === "accepted") {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        /* best effort */
      }
      setCanInstall(false);
      return true;
    }
    return false;
  };

  return { platform, canInstall, promptInstall };
}
