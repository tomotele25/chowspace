"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKENDURL =
    "https://chowspace-backend.vercel.app" 

  useEffect(() => {
    if (orderId) {
      axios
        .get(`${BACKENDURL}/api/confirm/${orderId}`)
        .then((res) => {
          if (res.data.success) {
            setOrder(res.data.order);
          } else {
            setError("Could not fetch order details");
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Invalid or expired confirmation link");
          setLoading(false);
        });
    }
  }, [orderId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <p className="text-gray-600 text-lg">Loading confirmation...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <p className="text-red-600 text-lg font-semibold text-center">
          {error}
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full animate-fadeIn">
        <div className="flex flex-col items-center">
          <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 text-center">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Thank you for ordering from{" "}
            <span className="font-semibold">CHOWSPACE</span>.
          </p>

          {/* Order summary */}
          <div className="w-full bg-gray-100 rounded-xl p-4 mb-6 space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">Order ID:</span> {orderId}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Customer:</span>{" "}
              {order?.guestInfo?.name || "N/A"}
            </p>
            <p className="text-gray-700 font-semibold mt-2">
              <span className="font-semibold">Total:</span> ₦
              {order?.totalAmount || "N/A"}
            </p>
          </div>

          {/* Items list */}
          <div className="w-full bg-gray-50 border rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">Items Ordered</h2>
            {order?.items && order.items.length > 0 ? (
              <ul className="space-y-2">
                {order.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between text-gray-700 text-sm border-b pb-2"
                  >
                    <span>
                      {item.name}{" "}
                      <span className="text-gray-500">x{item.quantity}</span>
                    </span>
                    <span>₦{item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No items found.</p>
            )}
          </div>

          <p className="text-green-600 font-bold text-center text-lg">
            ✅ Your order has been confirmed successfully!
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-8 w-full py-3 bg-[#AE2108] hover:bg-[#941B06] text-white font-bold rounded-full shadow-lg transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
