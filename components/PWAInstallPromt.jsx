"use client";
import { useEffect, useState } from "react";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#AE2108] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
      <span>Install ChowSpace for a better experience!</span>
      <button
        onClick={handleInstallClick}
        className="bg-white text-[#AE2108] px-3 py-1 rounded font-semibold"
      >
        Install
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
