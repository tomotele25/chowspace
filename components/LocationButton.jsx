"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

const HINT_KEY = "chowspace_location_hint_seen";

/**
 * Floating location picker, stacked above the Support and Scroll-to-top
 * buttons on the home page. Selecting a location drives the home-page vendor
 * filter (state lives in pages/index.js) and is persisted to localStorage.
 *
 * On a visitor's first arrival it shows a one-time tooltip so they know the
 * button is there and what it does.
 *
 * Props:
 *   locations - string[] of area names
 *   value     - currently selected location ("All" for no filter)
 *   onSelect  - (loc: string) => void
 */
const LocationButton = ({ locations = [], value = "All", onSelect }) => {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_KEY)) setShowHint(true);
    } catch {
      /* private mode / storage blocked — just skip the hint */
    }
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => dismissHint(), 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHint]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const dismissHint = () => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const pick = (loc) => {
    onSelect?.(loc);
    setOpen(false);
    dismissHint();
  };

  const label = value && value !== "All" ? value : "Set location";

  return (
    <div ref={ref} className="fixed bottom-32 right-6 z-50">
      {showHint && !open && (
        <div className="absolute bottom-14 right-0 w-56 bg-white border border-red-200 shadow-xl rounded-xl p-3 text-xs text-gray-600">
          <button
            onClick={dismissHint}
            aria-label="Dismiss"
            className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600"
          >
            <X size={13} />
          </button>
          <p className="font-semibold text-gray-800 mb-0.5">
            Change your location
          </p>
          Tap here to pick your area — we&rsquo;ll show restaurants that deliver
          to you.
          <span className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-red-200 rotate-45" />
        </div>
      )}

      {open && (
        <div className="absolute bottom-14 right-0 w-56 max-h-72 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200 py-1.5">
          <p className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            Deliver to
          </p>
          <button
            onClick={() => pick("All")}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-[#AE2108]/5 ${
              value === "All"
                ? "text-[#AE2108] font-semibold"
                : "text-gray-700"
            }`}
          >
            All locations
          </button>
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => pick(loc)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#AE2108]/5 ${
                value === loc
                  ? "text-[#AE2108] font-semibold"
                  : "text-gray-700"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setOpen((p) => !p);
          dismissHint();
        }}
        title="Set your location"
        aria-label="Set your location"
        className="flex items-center gap-2 bg-[#AE2108] hover:bg-[#941B06] text-white pl-3 pr-4 py-3 rounded-full shadow-lg transition max-w-[11rem]"
      >
        <MapPin className="w-5 h-5 shrink-0" />
        <span className="text-sm font-semibold truncate">{label}</span>
      </button>
    </div>
  );
};

export default LocationButton;
