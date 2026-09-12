"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import {
  canShowInstallBanner,
  recordBannerSeen,
  dismissInstallBanner,
} from "@/lib/installBannerVisibility";

const IOS_APP_URL =
  process.env.NEXT_PUBLIC_IOS_APP_URL ||
  "https://apps.apple.com/ng/app/chowspace/id6800899251";

/**
 * "Get the app", inline — not a fixed overlay, so it can never sit on top of
 * a button or intercept a tap. Used on the home page (full) and on
 * pages/confirm/[orderId].js (compact, after an order is already placed).
 *
 * Device-aware: iOS links straight to the App Store; Android/other offers
 * the PWA's own install prompt (there's no native Android app yet — see
 * lib/useInstallPrompt.js). Renders nothing on desktop, and nothing on iOS
 * if IOS_APP_URL is ever empty (never a dead link).
 *
 * Visibility is shared with components/AndroidInstallBanner.jsx via
 * lib/installBannerVisibility.js: a 7-day cooldown after dismissal, and a
 * hard cap on total impressions so it fades out even if nobody closes it.
 */
export default function GetAppBanner({ compact = false }) {
  const { platform, canInstall, promptInstall } = useInstallPrompt();
  const [show, setShow] = useState(false);

  const eligible =
    (platform === "ios" && IOS_APP_URL) || (platform === "android" && canInstall);

  useEffect(() => {
    if (!eligible) return;
    if (!canShowInstallBanner()) return;
    setShow(true);
    recordBannerSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible]);

  if (!show) return null;

  const handleDismiss = () => {
    dismissInstallBanner();
    setShow(false);
  };

  const handlePrimaryAction = async () => {
    if (platform === "ios") {
      window.open(IOS_APP_URL, "_blank", "noopener,noreferrer");
      return;
    }
    const accepted = await promptInstall();
    if (accepted) setShow(false);
  };

  return (
    <div
      className={`mx-auto ${compact ? "mt-6 max-w-2xl" : "mt-4 max-w-7xl"} px-5 sm:px-8 ${compact ? "" : "lg:px-12"}`}
    >
      <div
        className={`relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#AE2108] via-[#C63210] to-[#7a1605] text-white shadow-lg ${
          compact ? "px-4 py-3" : "px-5 py-4"
        }`}
      >
        <span className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
        <span className="absolute -bottom-10 right-16 h-20 w-20 rounded-full bg-white/10" />

        {platform === "ios" ? (
          <Smartphone className="h-6 w-6 shrink-0" />
        ) : (
          <Download className="h-6 w-6 shrink-0" />
        )}

        <div className="relative flex-1 min-w-0">
          <p className={`font-black tracking-wide ${compact ? "text-xs" : "text-sm"}`}>
            {platform === "ios" ? "Get the Chowspace app" : "Install the Chowspace app"}
          </p>
          <p className={`text-white/80 ${compact ? "text-[11px]" : "text-xs"}`}>
            {platform === "ios"
              ? "Order faster from the App Store"
              : "Faster ordering, right from your home screen"}
          </p>
        </div>

        <button
          onClick={handlePrimaryAction}
          className="relative shrink-0 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-[#AE2108] whitespace-nowrap"
        >
          {platform === "ios" ? "App Store" : "Install"}
        </button>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="relative shrink-0 rounded-full bg-white/15 p-1.5 hover:bg-white/25"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
