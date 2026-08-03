"use client";

import { BACKENDURL } from "@/lib/api";
import React, { useState } from "react";
import { Star, CheckCircle, Crown } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";

const plans = [
  {
    name: "Basic",
    price: 4500,
    displayPrice: "₦4,500",
    duration: "7 Days",
    benefits: [
      "Appear on ChowSpace home",
      "Visible to new customers",
      "Mild boost in search visibility",
      "Support from ChowSpace team",
    ],
    icon: <Star className="text-[#AE2108]" size={20} />,
    bg: "bg-white",
    border: "border-[#AE2108]",
  },
  {
    name: "Premium",
    price: 12550,
    displayPrice: "₦12,550",
    duration: "30 Days",
    benefits: [
      "Top 4 Restaurants of the Week",
      "Custom Graphics for Promotion",
      "Guaranteed 30% Sales Boost",
      "Exclusive ChowSpace Campaigns",
      "Gold Badge on Profile",
    ],
    icon: <Crown className="text-yellow-500" size={20} />,
    bg: "bg-yellow-50",
    border: "border-yellow-500",
  },
];

const Subscribe = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan) => {
    if (!session?.user?.email || !session?.user?.vendorId) {
      toast.error("Missing vendor information. Please login again.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${BACKENDURL}/api/paystack/init-promote`, {
        email: session?.user?.email,
        amount: plan.price,
        vendorId: session?.user?.vendorId,
        tier: plan.name.toLowerCase(),
      });

      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        toast.error("Unable to initialize payment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 md:px-20 bg-gray-50 text-gray-800">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-[#AE2108]">
        Boost Your Visibility on ChowSpace 🚀
      </h1>
      <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
        Choose a plan that fits your restaurant’s growth. Get discovered by more
        customers and increase your orders with our promotional tiers.
      </p>

      <div className="grid md:grid-cols-2 gap-10">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`p-6 rounded-2xl shadow-md border-2 ${plan.border} ${plan.bg} transform transition duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-2 mb-4">
              {plan.icon}
              <h2 className="text-2xl font-semibold">{plan.name} Plan</h2>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold">{plan.displayPrice}</span>
              <span className="ml-2 text-gray-600">/ {plan.duration}</span>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle className="text-[#AE2108]" size={18} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={loading}
              className="w-full py-2 px-4 bg-[#AE2108] text-white rounded-xl hover:bg-[#911b06] transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Subscribe Now"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-500 text-sm">
          Your plan will activate immediately after payment and promotion will
          begin.
        </p>
      </div>
    </div>
  );
};

export default Subscribe;
