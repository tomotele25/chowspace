"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Sparkles, X } from "lucide-react";

const DISMISS_KEY = "chowspace_wrapped_2026_dismissed";

/**
 * Home-page invite to ChowSpace Wrapped 2026, shown to signed-in customers.
 * Dismissible; the choice is remembered in localStorage.
 */
const WrappedBanner = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "customer") return;
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, [session]);

  if (!show) return null;

  const dismiss = (e) => {
    e.stopPropagation();
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-7xl px-5 sm:px-8 lg:px-12">
      <button
        onClick={() => router.push("/wrapped")}
        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#AE2108] via-[#C63210] to-[#7a1605] px-5 py-4 text-left text-white shadow-lg"
      >
        <span className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
        <span className="absolute -bottom-10 right-16 h-20 w-20 rounded-full bg-white/10" />
        <Sparkles className="h-7 w-7 shrink-0" />
        <span className="flex-1">
          <span className="block text-sm font-black tracking-wide">
            Your ChowSpace Wrapped 2026 is ready
          </span>
          <span className="block text-xs text-white/80">
            See what you ordered this year &rarr;
          </span>
        </span>
        <span
          onClick={dismiss}
          role="button"
          aria-label="Dismiss"
          className="rounded-full p-1.5 text-white/70 hover:bg-white/15 hover:text-white"
        >
          <X className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
};

export default WrappedBanner;
