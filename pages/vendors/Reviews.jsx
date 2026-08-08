"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Star } from "lucide-react";

import VendorLayout from "@/components/layouts/VendorLayout";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2006";

const Reviews = () => {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(
          `${BACKENDURL}/api/vendor/${session?.user?.vendorId}/reviews`,
        );
        setReviews(response.data.reviews);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        toast.error("Failed to load reviews");
      }
    };

    if (session?.user?.vendorId) fetchReviews();
  }, [session?.user?.vendorId]);

  const average = reviews?.length
    ? (
        reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / reviews.length
      ).toFixed(1)
    : null;

  return (
    <VendorLayout
      title="Customer Reviews"
      subtitle={
        average
          ? `${average} out of 5 · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
          : undefined
      }
    >
      <div className="p-4 md:p-6">
        {reviews?.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white shadow-sm rounded-xl p-5 border border-gray-100 transition hover:shadow-md"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < review.stars ? "#FFD700" : "none"}
                      stroke="#FFD700"
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {review.stars}/5
                  </span>
                </div>
                <p className="text-sm text-gray-800 mb-2 italic">
                  &ldquo;{review.comment}&rdquo;
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-[#AE2108]">
                    Customer ID:
                  </span>{" "}
                  {review.customerId}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet.</p>
        )}
      </div>
    </VendorLayout>
  );
};

export default Reviews;
