"use client";

import { BACKENDURL } from "@/lib/api";
import { useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";

/**
 * Leave-a-review form. Shared by the post-payment modal and the /ReviewPage
 * route (the link sent to customers on WhatsApp after checkout).
 *
 * Props:
 *   vendorId     - required, the vendor being reviewed
 *   callbackUrl  - where to return after signing in (defaults to current path)
 *   onSubmitted  - called after a successful POST, so the parent can refresh
 *                  its reviews list
 */
const ReviewSection = ({ vendorId, callbackUrl, onSubmitted }) => {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const goToLogin = () => {
    const cb =
      callbackUrl ||
      (typeof window !== "undefined" ? window.location.pathname : "/");
    router.push(`/Login?as=customer&callbackUrl=${encodeURIComponent(cb)}`);
  };

  const handleRating = (star) => setRating(star);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.user?.accessToken) return goToLogin();
    if (!reviewText.trim() || !rating)
      return toast.error("Please enter a review and select a rating.");

    setSubmitting(true);

    try {
      await axios.post(
        `${BACKENDURL}/api/rateVendor`,
        { stars: rating, comment: reviewText, vendorId },
        { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
      );

      toast.success("Review submitted!");
      setReviewText("");
      setRating(0);
      onSubmitted?.();
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error);
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }

    setSubmitting(false);
  };

  return (
    <div className="mt-10 bg-white p-6 rounded-2xl shadow-md border border-gray-100 max-w-xl mx-auto">
      <Toaster position="top-right" />
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Leave a Review</h3>

      {status !== "loading" && !session?.user ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 mb-4">
            Sign in to leave a review for this restaurant.
          </p>
          <button
            onClick={goToLogin}
            className="bg-[#AE2108] hover:bg-[#911c06] transition text-white px-4 py-2 rounded-md text-sm"
          >
            Sign in to review
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                onClick={() => handleRating(star)}
                className={`cursor-pointer ${
                  star <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
                fill={star <= rating ? "currentColor" : "none"}
              />
            ))}
          </div>

          <textarea
            rows={4}
            className="w-full border border-gray-300 p-2 rounded-md text-sm resize-none"
            placeholder="Write your experience here..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#AE2108] hover:bg-[#911c06] transition text-white px-4 py-2 rounded-md text-sm"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReviewSection;
