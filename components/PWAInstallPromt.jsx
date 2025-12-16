"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#AE2108] to-[#F97316] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 z-50 animate-slide-up max-w-lg w-full">
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="font-medium text-sm sm:text-base">
          Install ChowSpace for a better experience!
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-white text-[#AE2108] px-4 py-1.5 rounded-lg font-semibold text-sm hover:scale-105 transition-transform shadow-md"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-white hover:text-gray-200"
        >
          <X size={18} />
        </button>
      </div>

      <style jsx>{`
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
        @keyframes slide-up {
          0% {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, 0%);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;
