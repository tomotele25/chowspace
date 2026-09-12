import "@/styles/globals.css";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { CategoryProvider } from "@/context/CategoryContext";
import NetworkStatus from "@/components/NetworkStatus";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";
import Loader from "@/components/Loader";
import { useState, useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { installAxiosSafety } from "@/lib/axiosSafety";
import AndroidInstallBanner from "@/components/AndroidInstallBanner";
import { getStoredReferralCode, trackReferralInstall } from "@/lib/referral";
// import PWAInstallPrompt from "../components/PWAInstallPromt";
// import IOSInstallNotice from "@/components/IOSInstallNotice";

// Registered at module scope so it is in place before any component mounts
// and fires its first request.
installAxiosSafety();

// Replaces the hand-rolled @font-face pair that used to live in
// globals.css. next/font/local self-hosts these same two files but adds
// automatic preloading and fallback-metrics injection (less layout shift on
// swap) for free — the two are the only weights actually used anywhere in
// the app, despite public/font/ shipping the entire Inter family.
const inter = localFont({
  src: [
    {
      path: "../public/font/web/InterDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/font/web/InterDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  let timer;

  useEffect(() => {
    const handleStart = () => {
      timer = setTimeout(() => setLoading(true), 200);
    };

    const handleComplete = () => {
      clearTimeout(timer);
      setLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  // Influencer install attribution: whichever device fires the browser's
  // native "installed" event, credit whatever referral code is still stored
  // (see lib/referral.js) — silently skipped if there isn't one.
  useEffect(() => {
    const onInstalled = () => trackReferralInstall(getStoredReferralCode());
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  return (
    <div className={inter.className}>
      <Toaster position="top-right" />

      <CategoryProvider>
        <CartProvider>
          <SessionProvider session={pageProps.session} refetchOnWindowFocus={false}>
            <NetworkStatus />
            {loading ? <Loader /> : <Component {...pageProps} />}
            <AndroidInstallBanner />
            {/* <PWAInstallPrompt /> */}
            {/* <IOSInstallNotice /> */}
            <SpeedInsights />
            <Analytics />
          </SessionProvider>
        </CartProvider>
      </CategoryProvider>
    </div>
  );
}
