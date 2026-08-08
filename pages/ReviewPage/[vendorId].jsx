"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import { useSession, signIn } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

const ReviewSection = ({ vendorId }) => {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const BACKENDURL = "https://chowspace-backend.vercel.app";

  const { data: session } = useSession();

  const handleRating = (star) => setRating(star);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If not logged in, show modal
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }

    if (!reviewText.trim() || !rating) {
      toast.error("Please enter a review and select a rating.");
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${BACKENDURL}/api/rateVendor`,
        {
          stars: rating,
          comment: reviewText,
          vendorId,
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        }
      );

      toast.success("Review submitted!");
      setReviewText("");
      setRating(0);
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = () => {
    // Redirect back to the same page after login
    signIn("credentials", { callbackUrl: `/ReviewPage/${vendorId}` });
  };

  return (
    <div className="mt-10 bg-white p-6 rounded-2xl shadow-md border border-gray-100 max-w-xl mx-auto">
      <Toaster position="top-right" />
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Leave a Review
      </h3>

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
          className="w-full border border-gray-300 p-2 rounded-md text-sm resize-none focus:ring-2 focus:ring-[#AE2108] focus:border-[#AE2108] transition"
          placeholder="Write your experience here..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
        />

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2 px-4 rounded-md text-sm text-white transition ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#AE2108] hover:bg-[#941B06]"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold mb-4">Login Required</h2>
            <p className="mb-6">You must be logged in to submit a review.</p>
            <button
              onClick={handleLogin}
              className="bg-[#AE2108] hover:bg-[#941B06] text-white py-2 px-4 rounded-md w-full mb-3"
            >
              Login
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="border border-gray-300 py-2 px-4 rounded-md w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
