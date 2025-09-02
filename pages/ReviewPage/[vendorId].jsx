"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

const ReviewSection = ({ vendorId }) => {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const BACKENDURL = "https://chowspace-backend.vercel.app";

  const { data: session } = useSession();

  const handleRating = (star) => setRating(star);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure user is logged in
    if (!session?.user) {
      toast.error("You need to log in to submit a review.");
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
              : "bg-[#AE2108] hover:bg-[#911c06]"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewSection;
