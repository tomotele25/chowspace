"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Gift,
  Settings,
  LogOut,
  MapPin,
  Heart,
  HelpCircle,
  Star,
  Sparkles,
} from "lucide-react";

const CustomersProfile = () => {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user || session.user.role !== "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-sm w-full">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            You're not logged in
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Please sign in to access your customer profile.
          </p>
          <button
            onClick={() => router.push("/Login")}
            className="px-5 py-2 rounded-full bg-[#AE2108] text-white hover:bg-[#941B06] transition text-sm font-medium"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 sm:gap-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#AE2108] text-white flex items-center justify-center rounded-full text-lg font-bold uppercase">
              {session.user.fullname?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Hello, {session.user.fullname} 👋
              </h2>
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="flex items-center px-4 py-2 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-red-50 hover:text-red-600 transition self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>

        {/* ChowSpace Wrapped */}
        <Link href="/wrapped">
          <div className="mb-4 flex items-center gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#AE2108] via-[#C63210] to-[#7a1605] p-4 text-white transition hover:brightness-110">
            <div className="rounded-full bg-white/15 p-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Your 2026 Wrapped</h4>
              <p className="text-xs text-white/80">
                See what you ordered this year
              </p>
            </div>
          </div>
        </Link>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Chowspace Points */}
          <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer transition">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-full shadow">
                <Star className="text-[#AE2108] w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">
                  Chowspace Points
                </h4>
                <p className="text-xs text-gray-500">
                  You currently have{" "}
                  <span className="font-semibold text-gray-700">0 points</span>
                </p>
              </div>
            </div>
          </div>

          <Link href="/customers/OrderHistory">
            <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer transition">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white rounded-full shadow">
                  <ShoppingBag className="text-[#AE2108] w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">
                    Order History
                  </h4>
                  <p className="text-xs text-gray-500">
                    Track and manage your previous orders
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/customers/Coupon">
            <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer transition">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white rounded-full shadow">
                  <Gift className="text-[#AE2108] w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">
                    Redeem Coupon
                  </h4>
                  <p className="text-xs text-gray-500">
                    Apply discount codes to your orders
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer transition">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-full shadow">
                <Settings className="text-[#AE2108] w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">
                  Account Settings
                </h4>
                <p className="text-xs text-gray-500">
                  Update your personal information
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer transition">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-full shadow">
                <MapPin className="text-[#AE2108] w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">
                  Delivery Address
                </h4>
                <p className="text-xs text-gray-500">
                  Manage your shipping locations
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer transition">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-full shadow">
                <Heart className="text-[#AE2108] w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">
                  Saved Items
                </h4>
                <p className="text-xs text-gray-500">
                  View items you saved for later
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer transition">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-full shadow">
                <HelpCircle className="text-[#AE2108] w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">
                  Help & Support
                </h4>
                <p className="text-xs text-gray-500">
                  Get help or contact ChowSpace
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersProfile;
