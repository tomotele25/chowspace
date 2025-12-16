"use client";
import { useEffect, useState } from "react";

export default function IOSInstallNotice() {
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(iOS);

    if (iOS && !window.matchMedia("(display-mode: standalone)").matches) {
      setShow(true);
    }
  }, []);

  if (!show || !isIOS) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xs w-[90%] bg-white rounded-2xl shadow-xl p-5 text-center border border-gray-200 animate-slideUp">
      <p className="text-gray-900 font-semibold text-sm sm:text-base mb-2">
        Install <span className="text-[#AE2108]">ChowSpace</span> on your iPhone
      </p>
      <p className="text-gray-600 text-xs sm:text-sm mb-4">
        Tap <span className="font-bold">Share</span> and then{" "}
        <span className="font-bold">Add to Home Screen</span>
      </p>
      <button
        onClick={() => setShow(false)}
        className="px-5 py-2 bg-[#AE2108] text-white rounded-full font-medium hover:bg-[#941B06] transition-all text-sm sm:text-base"
      >
        Got it
      </button>

      {/* Optional: subtle arrow icon */}
      <div className="mt-2 text-gray-400 text-xs">
        ⬆️ Look for the share button
      </div>

      <style jsx>{`
        @keyframes slideUp {
          0% {
            transform: translateY(100%) translateX(-50%);
            opacity: 0;
          }
          100% {
            transform: translateY(0) translateX(-50%);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
