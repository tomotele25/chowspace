"use client";

import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewSection from "@/components/ReviewSection";
import VendorReviews from "@/components/VendorReviews";
import { BACKENDURL } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";

/**
 * Public review page. This is the URL sent to every customer over WhatsApp
 * after checkout (pages/checkout/[slug].js):
 *   https://chowspace.ng/ReviewPage/<vendorId>
 *
 * The vendor id comes from the route, not a prop — the previous version read a
 * `vendorId` prop that a Next.js page never receives, so every submission went
 * out with `vendorId: undefined`.
 */
const ReviewPage = () => {
  const router = useRouter();
  const { vendorId } = router.query;

  const { data, error, isLoading } = useSWR(
    router.isReady && vendorId
      ? `${BACKENDURL}/api/vendor/${vendorId}/reviews?page=1&limit=1`
      : null,
    fetcher
  );

  const notFound = error?.response?.status === 404;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
        {!router.isReady || isLoading ? (
          <p className="text-center text-gray-400 mt-10">Loading…</p>
        ) : notFound ? (
          <p className="text-center text-gray-600 mt-10">
            This restaurant could not be found.
          </p>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Leave a review
              {data?.businessName ? (
                <>
                  {" "}
                  for <span className="text-[#AE2108]">{data.businessName}</span>
                </>
              ) : null}
            </h1>
            <p className="text-center text-gray-500 text-sm mt-1">
              Tell others what your experience was like.
            </p>

            <ReviewSection
              vendorId={vendorId}
              callbackUrl={`/ReviewPage/${vendorId}`}
              onSubmitted={() =>
                mutate(
                  (key) =>
                    typeof key === "string" &&
                    key.startsWith(VendorReviews.swrKeyPrefix(vendorId))
                )
              }
            />

            <VendorReviews vendorId={vendorId} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ReviewPage;
