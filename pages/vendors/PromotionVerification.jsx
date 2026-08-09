import { BACKENDURL } from "@/lib/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";


const PromotionVerification = () => {
  const router = useRouter();
  const { reference } = router.query;
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    if (!reference) return;

    const verifyPayment = async () => {
      try {
        const res = await axios.post(
          `${BACKENDURL}/api/paystack/verify-promote`,
          {
            reference,
          }
        );

        if (res.data.success) {
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error(error);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="max-w-md w-full text-center border shadow-xl p-10 rounded-2xl">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#AE2108]" />
            <p className="text-lg text-[#AE2108] font-medium">
              Verifying your promotion...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-14 h-14 text-[#AE2108]" />
            <h2 className="text-2xl font-bold text-[#AE2108]">
              Promotion Activated 🎉
            </h2>
            <p className="text-gray-700">
              Your promotion is now live on ChowSpace!
            </p>
            <button
              onClick={() => router.push("/vendor/dashboard")}
              className="mt-6 bg-[#AE2108] text-white px-6 py-2 rounded-full hover:bg-[#941B06] transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-14 h-14 text-red-500" />
            <h2 className="text-2xl font-bold text-red-500">
              Verification Failed ❌
            </h2>
            <p className="text-gray-700">
              Something went wrong. Please try again or contact support.
            </p>
            <button
              onClick={() => router.push("/vendor/promote")}
              className="mt-6 border border-[#AE2108] text-[#AE2108] px-6 py-2 rounded-full hover:bg-[#AE2108] hover:text-white transition"
            >
              Retry Promotion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionVerification;
