import "@/styles/globals.css";
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
// import PWAInstallPrompt from "../components/PWAInstallPromt";
// import IOSInstallNotice from "@/components/IOSInstallNotice";

// Registered at module scope so it is in place before any component mounts
// and fires its first request.
installAxiosSafety();

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

  return (
    <>
      <Toaster position="top-right" />

      <CategoryProvider>
        <CartProvider>
          <SessionProvider session={pageProps.session} refetchOnWindowFocus={false}>
            <NetworkStatus />
            {loading ? <Loader /> : <Component {...pageProps} />}
            {/* <PWAInstallPrompt /> */}
            {/* <IOSInstallNotice /> */}
            <SpeedInsights />
            <Analytics />
          </SessionProvider>
        </CartProvider>
      </CategoryProvider>
    </>
  );
}
