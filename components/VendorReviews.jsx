"use client";

import { useState } from "react";
import useSWR from "swr";
import { Star } from "lucide-react";
import { BACKENDURL } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";

const relativeDate = (dateStr) => {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const Stars = ({ value = 0, size = 14 }) => (
  <span className="inline-flex text-yellow-400">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        fill={s <= Math.round(value) ? "currentColor" : "none"}
        className={s <= Math.round(value) ? "" : "text-gray-300"}
      />
    ))}
  </span>
);

/**
 * Customer-facing list of a vendor's written reviews, with the blended
 * headline rating. Reads GET /api/vendor/:vendorId/reviews (paginated).
 *
 * Exposes its SWR key as VendorReviews.swrKey(vendorId) so a submit form can
 * revalidate it via mutate().
 */
const VendorReviews = ({ vendorId }) => {
  const [shown, setShown] = useState(10);
  const { data, isLoading } = useSWR(
    vendorId
      ? `${BACKENDURL}/api/vendor/${vendorId}/reviews?page=1&limit=${shown}`
      : null,
    fetcher
  );

  if (!vendorId) return null;

  const reviews = data?.reviews || [];
  const headline = data?.displayRating ?? data?.averageRating ?? 0;
  const count = data?.reviewCount ?? 0;

  return (
    <div className="mt-10 max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Reviews</h3>
        {count > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <Stars value={headline} />
            {Number(headline).toFixed(1)} · {count}{" "}
            {count === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>

      {isLoading && !data ? (
        <p className="text-sm text-gray-400">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">
          No written reviews yet. Be the first to leave one.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li
              key={r._id}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">
                  {r.customerId?.fullname || "Customer"}
                </span>
                <span className="text-xs text-gray-400">
                  {relativeDate(r.createdAt)}
                </span>
              </div>
              <Stars value={r.stars} size={13} />
              {r.comment && (
                <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {data?.hasMore && (
        <button
          onClick={() => setShown((n) => n + 10)}
          className="mt-4 text-sm font-semibold text-[#AE2108] hover:underline"
        >
          Load more
        </button>
      )}
    </div>
  );
};

VendorReviews.swrKeyPrefix = (vendorId) =>
  `${BACKENDURL}/api/vendor/${vendorId}/reviews`;

export default VendorReviews;
