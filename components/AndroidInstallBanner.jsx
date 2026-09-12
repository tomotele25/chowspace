"use client";
import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { canShowInstallBanner, recordBannerSeen, dismissInstallBanner } from "@/lib/installBannerVisibility";

/**
 * Android's counterpart to IOSInstallNotice.jsx — a fixed bottom pill offering
 * the browser's own install prompt as soon as it's available, since there's
 * no native Android app yet and the PWA fills that role.
 *
 * Install/prompt mechanics live in lib/useInstallPrompt.js; visibility rules
 * (dismiss cooldown + impression cap) live in lib/installBannerVisibility.js,
 * shared with components/GetAppBanner.jsx so dismissing or seeing one counts
 * against the same budget as the other.
 */
export default function AndroidInstallBanner() {
  const { platform, canInstall, promptInstall } = useInstallPrompt();
  const [show, setShow] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (platform !== "android" || !canInstall) return;
    if (!canShowInstallBanner()) return;
    setShow(true);
    recordBannerSeen();
  }, [platform, canInstall]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted) handleDismiss();
    else setShow(false);
  };

  const handleDismiss = () => {
    dismissInstallBanner();
    setDismissing(true);
    setTimeout(() => setShow(false), 400);
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes cs-rise { 0% { transform: translateY(110%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes cs-sink { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(110%); opacity: 0; } }
        .android-notice { animation: cs-rise 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .android-notice.leaving { animation: cs-sink 0.4s ease-in forwards; }
      `}</style>

      <div
        className={`android-notice ${dismissing ? "leaving" : ""} fixed bottom-5 left-1/2 -translate-x-1/2 z-[999] w-[92%] max-w-sm`}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "20px",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(174,33,8,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "3px",
              background: "linear-gradient(90deg, #AE2108 0%, #e85d3a 100%)",
            }}
          />
          <div className="px-4 py-4 flex items-center gap-3">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "linear-gradient(135deg, #AE2108 0%, #c73a1e 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(174,33,8,0.35)",
                flexShrink: 0,
                color: "white",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              C
            </div>

            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#111" }}>
                Get the Chowspace app
              </p>
              <p style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                Faster ordering, right from your home screen
              </p>
            </div>

            <button
              onClick={handleInstall}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #AE2108 0%, #c73a1e 100%)",
                color: "white",
                fontWeight: 700,
                fontSize: 12.5,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 14px rgba(174,33,8,0.3)",
              }}
            >
              Install
            </button>

            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.06)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1 1l8 8M9 1L1 9"
                  stroke="#666"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
