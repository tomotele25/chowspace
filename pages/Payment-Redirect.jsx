"use client";

import { BACKENDURL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  CheckCircle,
  Truck,
  Home,
  MapPin,
  MessageCircleWarning,
  PencilLine,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import ReviewSection from "@/components/ReviewSection";

export default function OrderConfirmed() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disputeReasons, setDisputeReasons] = useState([]);

  useEffect(() => {
    const verifyPayment = async () => {
      const { reference } = router.query;
      if (!router.isReady || !reference) return;

      const storedOrder = localStorage.getItem("latestOrder");
      if (!storedOrder) return;

      try {
        const response = await axios.post(`${BACKENDURL}/api/verifyPayment`, {
          reference,
        });

        if (response.data.success) {
          setOrder(response.data.order);
          localStorage.removeItem("latestOrder");
          setVerificationError(false);
        }
      } catch (error) {
        console.error("Error verifying payment:", error.message);
        setVerificationError(true);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [router.isReady, router.query.reference]);

  useEffect(() => {
    const fetchDisputeReasons = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/dispute/reasons`);
        setDisputeReasons(res.data.reasons || []);
      } catch (err) {
        console.error("Failed to fetch dispute reasons", err);
      }
    };

    fetchDisputeReasons();
  }, []);

  const handleRetry = () => {
    setVerifying(true);
    setVerificationError(false);
    router.replace(router.asPath);
  };

  const handleGoHome = () => router.push("/");

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmitDispute = async () => {
    if (selectedReasons.length === 0) {
      toast.error("Please select at least one reason.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${BACKENDURL}/api/create-dispute`, {
        reasons: selectedReasons,
        message,
        orderId: order._id,
      });

      if (res.data.success) {
        toast.success("Dispute submitted successfully!");
        setDisputeModal(false);
        setSelectedReasons([]);
        setMessage("");
      } else {
        toast.error(res.data.message || "Failed to submit dispute.");
      }
    } catch (err) {
      toast.error("An error occurred. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf8f7] px-4 py-10">
      <Toaster position="top-right" />
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-2xl w-full text-center relative overflow-hidden">
        <CheckCircle
          size={58}
          className="text-green-600 mx-auto mb-3 animate-pulse"
        />
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">
          {verifying ? "Verifying payment..." : "Order Confirmed!"}
        </h1>
        <p className="text-gray-600 text-sm mb-3">
          {verifying
            ? "Please wait while we verify your payment..."
            : "Thanks for ordering with ChowSpace 🎉"}
        </p>

        {order && (
          <p className="text-xs text-gray-400 mb-5">
            Order ID: <span className="font-mono">{order._id}</span>
          </p>
        )}

        {verificationError && (
          <div className="mt-4 text-red-600 text-sm">
            Payment verification failed.{" "}
            <button
              onClick={handleRetry}
              className="underline text-[#AE2108] font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {order && (
          <div className="bg-gray-100 rounded-xl p-5 text-left mt-4 mb-6">
            <h2 className="text-lg font-semibold text-[#AE2108] mb-3">
              Order Summary
            </h2>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-14 h-14 relative rounded overflow-hidden border">
                    <Image
                      loading="lazy"
                      src={
                        item.image?.startsWith("http")
                          ? logo
                          : `${BACKENDURL}/uploads/${item.image}`
                      }
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × ₦{item.price}
                    </p>
                  </div>
                </div>
              ))}
              <div className="text-sm text-gray-700 flex items-center gap-2 mt-4">
                <MapPin size={16} /> <span>{order.guestInfo?.address}</span>
              </div>
            </div>
          </div>
        )}

        {!verifying && order && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mt-8">
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 px-5 py-2 border border-[#AE2108] text-[#AE2108] rounded-md hover:bg-red-50 transition"
            >
              <Home size={18} /> Go Home
            </button>
            <button
              onClick={() => setDisputeModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2 border border-[#AE2108] text-[#AE2108] rounded-md hover:bg-red-50 transition"
            >
              <MessageCircleWarning size={18} /> Order Dispute
            </button>
            <button
              onClick={() => setReviewModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2 border border-[#AE2108] text-[#AE2108] rounded-md hover:bg-red-50 transition"
            >
              <PencilLine size={18} /> Leave a Review
            </button>
          </div>
        )}

        {/* Review Modal */}
        {reviewModal && order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl relative">
              <div className="absolute top-12 right-2">
                <button
                  onClick={() => setReviewModal(false)}
                  className="bg-white  text-gray-800 rounded-full shadow px-2 py-1 hover:bg-gray-100"
                >
                  <XIcon color="black" fontWeight=" bold " />
                </button>
              </div>
              <ReviewSection vendorId={order.vendorId} />
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {disputeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Dispute Order
              </h2>

              <p className="text-sm text-gray-600 mb-3">
                What seems to be the issue?
              </p>

              <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
                {disputeReasons.map((issue, idx) => (
                  <label key={idx} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-red-600"
                      value={issue}
                      checked={selectedReasons.includes(issue)}
                      onChange={() => toggleReason(issue)}
                    />
                    <span className="text-sm text-gray-700">{issue}</span>
                  </label>
                ))}
              </div>

              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Additional details (optional)..."
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setDisputeModal(false)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDispute}
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Truck
          size={120}
          className="absolute -right-12 bottom-[-20px] text-[#fcd8d4] rotate-6 opacity-10"
        />
      </div>
    </div>
  );
}
