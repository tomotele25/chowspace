"use client";

import { BACKENDURL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PackageOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  User,
  UtensilsCrossed,
  Wallet,
  Rocket,
  Star,
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/vendors/Dashboard" },
  { name: "Orders", icon: PackageOpen, path: "/vendors/Orders" },
  { name: "Reviews", icon: Star, path: "/vendors/Reviews" },
  {
    name: "Products",
    icon: UtensilsCrossed,
    path: "/vendors/ManageProducts",
  },
  { name: "Wallet", icon: Wallet, path: "/vendors/Wallet" },
  { name: "Profile", icon: User, path: "/vendors/Profile" },
  { name: "Subscribe", icon: Rocket, path: "/vendors/Subscribe" },
  { name: "Manage Team", icon: Users, path: "/vendors/ManageTeam" },
  { name: "Settings", icon: Settings, path: "/vendor/settings" },
];
const CustomersProfile = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(
          `${BACKENDURL}/api/vendor/${session?.user?.vendorId}/reviews`
        );
        setReviews(response.data.reviews);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      }
    };

    if (session?.user?.vendorId) fetchReviews();
  }, [session?.user?.vendorId]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/Login" });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`w-64 bg-white shadow-md flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-30 md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h1 className="text-xl font-bold text-[#AE2108]">Chowspace</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-auto px-4 py-4 space-y-1">
          {menuItems.map(({ name, icon: Icon, path }) => (
            <Link
              key={name}
              href={path}
              className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
            >
              <Icon size={18} />
              {name}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-500 hover:bg-red-100 px-3 py-2 rounded-md w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0  overflow-y-auto p-6 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#AE2108]">
            Customer Reviews
          </h2>
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 bg-gray-200 rounded"
          >
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {reviews?.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white shadow-md rounded-xl p-5 border border-gray-100 transition hover:shadow-lg"
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
                  "{review.comment}"
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
      </main>
    </div>
  );
};

export default CustomersProfile;
