import { useEffect } from "react";
import { useRouter } from "next/router";
import { storeReferralCode, trackReferralClick } from "@/lib/referral";

/**
 * Influencer link landing page: chowspace.ng/i/<code>
 *
 * Pure redirect — nothing renders. Stores the code for 30-day order
 * attribution (see lib/referral.js), fires a best-effort click beacon, then
 * sends the visitor on to the target. `?to=/vendors/menu/<slug>` lets an
 * influencer's link drop someone straight into a specific vendor; without it,
 * home.
 */
export default function InfluencerLink() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { code, to } = router.query;
    if (typeof code !== "string" || !code) {
      router.replace("/");
      return;
    }

    storeReferralCode(code);
    trackReferralClick(code, typeof to === "string" ? to : "/");

    const target = typeof to === "string" && to.startsWith("/") ? to : "/";
    router.replace(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return null;
}
